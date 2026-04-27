import { createServerFn, getWebRequest } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { eq, sql, asc, desc, inArray, and, or, like } from 'drizzle-orm'
import { read, utils } from 'xlsx'
import * as diacritic from 'diacritic'

const getTable = (resource: string): any => {
  // @ts-ignore
  const table = schema[resource];
  if (!table) throw new Error(`Resource "${resource}" not found in schema.`);
  return table;
};

const normalize = (str: string) => {
  if (!str) return '';
  const clean = diacritic.clean(str);
  const normalized = clean
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove everything that is not a letter or number
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove accents
  
  // Special mappings for common excel headers
  if (normalized === 'cod' || normalized === 'nro' || normalized === 'id') return 'codigo';
  
  return normalized;
}

function transformData(table: any, data: any): any {
  const transformed = { ...data };
  
  // Remove id if it's null or undefined to let DB handle auto-increment
  if (transformed.id === null || transformed.id === undefined) {
    delete transformed.id;
  }

  for (const key in table) {
    const column = table[key];
    if (column && typeof column === 'object' && (column.columnType || column.name)) {
      const value = transformed[key];
      
      if (value !== undefined && value !== null) {
        // Check if it's a timestamp column
        const mode = column.config?.mode || column.mode;
        
        if (mode === 'timestamp' || mode === 'timestamp_ms') {
          if (typeof value === 'string' && value !== '') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              transformed[key] = date;
            }
          } else if (typeof value === 'number') {
            transformed[key] = new Date(value);
          }
        } 
        else if (key.startsWith('id_') && typeof value === 'string' && value !== '') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            transformed[key] = numValue;
          }
        }
      }
    }
  }
  
  return transformed;
}

function findMissingRequiredField(table: any, data: any, isUpdate: boolean): string | undefined {
  for (const key in table) {
    const column = table[key];
    if (column && typeof column === 'object' && (column.columnType || column.name)) {
      if (key === 'id') continue;
      if (column.notNull) {
        const value = data[key];
        const isPresent = key in data;
        if (isUpdate) {
          if (isPresent && (value === null || value === undefined || (typeof value === 'string' && value.trim() === ''))) {
            return key;
          }
        } else {
          if (!isPresent || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return key;
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Fills missing required fields with sensible defaults for import
 */
function fillMissingFields(resource: string, table: any, data: any): any {
  const result = { ...data };
  
  // Special business logic for Clientes before generic filling
  if (resource === 'clientes') {
    // 1. Handle Llamar S/N
    if (!result['llamar_sn'] || (result['llamar_sn'] !== 'S' && result['llamar_sn'] !== 'N')) {
      result['llamar_sn'] = 'S';
    }

    // 2. Handle Forma Contacto based on Llamar S/N
    if (result['llamar_sn'] === 'N') {
      result['forma_contacto'] = '-';
    } else if (!result['forma_contacto'] || result['forma_contacto'].trim() === '') {
      result['forma_contacto'] = 'No especificado';
    }

    // 3. Handle Nombre Fantasia
    if (!result['nombre_fantasia'] || result['nombre_fantasia'].trim() === '') {
      result['nombre_fantasia'] = result['razon_social'] || '';
    }
  }

  for (const key in table) {
    const column = table[key];
    if (key === 'id') continue;
    
    if (column && typeof column === 'object' && column.notNull) {
      if (result[key] === undefined || result[key] === null || (typeof result[key] === 'string' && result[key].trim() === '')) {
        // Generic defaults based on type
        if (column.columnType === 'integer' || column.columnType === 'number') {
          result[key] = 0;
        } else {
          result[key] = '';
        }
      }
    }
  }
  return result;
}

export const getListFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const { page, perPage } = params.pagination
    const sortField = params.sort?.field || 'id'
    const sortOrder = params.sort?.order || 'ASC'

    const filters = Object.entries(params.filter).map(([key, value]) => {
      if (key === 'q') return undefined;
      const column = table[key];
      let finalValue = value;
      if (column && typeof column === 'object' && (column.columnType === 'integer' || column.columnType === 'number')) {
        const numValue = Number(value);
        if (!isNaN(numValue)) finalValue = numValue;
      }
      return eq(table[key], finalValue)
    }).filter(Boolean)

    if (params.filter.q) {
      const searchQuery = String(params.filter.q).toLowerCase();
      const searchConditions = [];
      if (table.nombre) searchConditions.push(like(sql`lower(${table.nombre})`, `%${searchQuery}%`));
      if (table.razon_social) searchConditions.push(like(sql`lower(${table.razon_social})`, `%${searchQuery}%`));
      if (table.nombre_fantasia) searchConditions.push(like(sql`lower(${table.nombre_fantasia})`, `%${searchQuery}%`));
      if (table.cuit) searchConditions.push(like(table.cuit, `%${searchQuery}%`));
      if (table.codigo) {
        searchConditions.push(like(sql`lower(cast(${table.codigo} as text))`, `%${searchQuery}%`));
      }
      if (table.fecha_envio) {
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(searchQuery)) {
          const [day, month, year] = searchQuery.split('/');
          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          searchConditions.push(like(sql`strftime('%Y-%m-%d', datetime(${table.fecha_envio} / 1000, 'unixepoch'))`, `%${formattedDate}%`));
        } else {
          searchConditions.push(like(sql`strftime('%Y-%m-%d', datetime(${table.fecha_envio} / 1000, 'unixepoch'))`, `%${searchQuery}%`));
        }
      }
      if (searchConditions.length > 0) filters.push(or(...searchConditions));
    }

    const items = await getDb(env.DB)
      .select()
      .from(table)
      .where(filters.length ? and(...filters) : undefined)
      .limit(perPage)
      .offset((page - 1) * perPage)
      .orderBy(sortOrder === 'ASC' ? asc(table[sortField]) : desc(table[sortField]))

    const [countResult] = await getDb(env.DB)
      .select({ count: sql<number>`count(*)` })
      .from(table)

    return { data: items, total: Number(countResult.count) }
  })

export const getOneFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const condition = resource === 'recorrido' 
      ? or(eq(table.id, params.id), eq(table.codigo, params.id))
      : eq(table.id, params.id);
    const [item] = await getDb(env.DB).select().from(table).where(condition)
    if (!item) throw new Error('Not found')
    return { data: item }
  })

export const getManyFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const condition = resource === 'recorrido'
      ? or(inArray(table.id, params.ids as any[]), inArray(table.codigo, params.ids as any[]))
      : inArray(table.id, params.ids as any[]);
    const items = await getDb(env.DB).select().from(table).where(condition);
    return { data: items }
  })

export const getManyReferenceFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const { page, perPage } = params.pagination
    const { field, order } = params.sort
    const filters = [
      eq(table[params.target], params.id),
      ...Object.entries(params.filter).map(([key, value]) => {
        const column = table[key];
        let finalValue = value;
        if (column && typeof column === 'object' && (column.columnType === 'integer' || column.columnType === 'number')) {
          const numValue = Number(value);
          if (!isNaN(numValue)) finalValue = numValue;
        }
        return eq(table[key], finalValue);
      })
    ]
    const items = await getDb(env.DB)
      .select()
      .from(table)
      .where(and(...filters))
      .limit(perPage)
      .offset((page - 1) * perPage)
      .orderBy(order === 'ASC' ? asc(table[field]) : desc(table[field]))
    const [countResult] = await getDb(env.DB).select({ count: sql<number>`count(*)` }).from(table).where(and(...filters));
    return { data: items, total: Number(countResult.count) }
  })

export const createFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const missingField = findMissingRequiredField(table, params.data, false);
    if (missingField) throw new Error(`VALIDATION_ERROR:required:${missingField}`);
    const transformedData = transformData(table, params.data);
    const items: {id: number}[] = await getDb(env.DB).insert(table).values(transformedData).returning({ id: table.id })
    return { data: items[0] }
  })

export const createManyFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: { data: any[] }}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const columnMap: Record<string, string> = {};
    Object.keys(table).forEach(key => {
      const column = table[key];
      if (key !== 'id' && typeof column === 'object' && (column.columnType || column.name)) {
        columnMap[normalize(key)] = key;
      }
    });
    const transformedData = params.data.map((item: any) => {
      const cleanItem: any = {};
      Object.keys(item).forEach(itemKey => {
        const normalizedItemKey = normalize(itemKey);
        const tableKey = columnMap[normalizedItemKey];
        if (tableKey) cleanItem[tableKey] = item[itemKey];
      });
      const dataWithDefaults = fillMissingFields(resource, table, cleanItem);
      return transformData(table, dataWithDefaults);
    }).filter(item => Object.keys(item).length > 0);
    if (transformedData.length === 0) throw new Error('No se encontraron columnas coincidentes en el archivo.');
    const chunkSize = 50;
    for (let i = 0; i < transformedData.length; i += chunkSize) {
      const chunk = transformedData.slice(i, i + chunkSize);
      await getDb(env.DB).insert(table).values(chunk);
    }
    return { data: { success: true, count: transformedData.length } }
  })

export const uploadToR2Fn = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }) => {
    const file = data.get('file') as File;
    if (!file) throw new Error('No file provided');
    const filename = `${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    let storage = env.STORAGE;
    if (!storage) {
      const request = getWebRequest();
      // @ts-ignore
      storage = request?.context?.cloudflare?.env?.STORAGE;
    }

    if (!storage) {
      throw new Error('El almacenamiento R2 no está configurado en el servidor.');
    }

    try {
      await storage.put(filename, arrayBuffer, {
        httpMetadata: { contentType: file.type }
      });
      return { filename };
    } catch (error: any) {
      console.error('Error uploading to R2:', error);
      throw new Error(`Error al subir el archivo a R2: ${error.message}`);
    }
  })

export const processFileFromR2Fn = createServerFn({ method: 'POST' })
  .inputValidator((data: { filename: string, resource: string }) => data)
  .handler(async ({ data }) => {
    const { filename, resource } = data;
    const table = getTable(resource);

    let storage = env.STORAGE;
    if (!storage) {
      const request = getWebRequest();
      // @ts-ignore
      storage = request?.context?.cloudflare?.env?.STORAGE;
    }

    if (!storage) throw new Error('El almacenamiento R2 no está configurado.');

    try {
      const object = await storage.get(filename);
      if (!object) throw new Error('Archivo no encontrado en R2');
      const arrayBuffer = await object.arrayBuffer();
      const wb = read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws, { raw: true });
      if (jsonData.length === 0) throw new Error('El archivo está vacío');
      const columnMap: Record<string, string> = {};
      Object.keys(table).forEach(key => {
        const column = table[key];
        if (key !== 'id' && typeof column === 'object' && (column.columnType || column.name)) {
          columnMap[normalize(key)] = key;
        }
      });
      const transformedData = jsonData.map((item: any) => {
        const cleanItem: any = {};
        Object.keys(item).forEach(itemKey => {
          const normalizedItemKey = normalize(itemKey);
          const tableKey = columnMap[normalizedItemKey];
          if (tableKey) {
            let value = item[itemKey];
            
            // Special handling for phone and numeric strings to prevent scientific notation
            if (tableKey === 'telefono' || tableKey === 'cuit' || tableKey === 'codigo') {
              if (typeof value === 'number') {
                // Convert to string without scientific notation
                value = value.toFixed(0);
              } else if (value !== null && value !== undefined) {
                value = String(value);
              }
            }
            
            cleanItem[tableKey] = value;
          }
        });
        const dataWithDefaults = fillMissingFields(resource, table, cleanItem);
        return transformData(table, dataWithDefaults);
      }).filter(item => Object.keys(item).length > 0);
      if (transformedData.length === 0) throw new Error('No se encontraron columnas coincidentes.');
      const chunkSize = 50;
      for (let i = 0; i < transformedData.length; i += chunkSize) {
        const chunk = transformedData.slice(i, i + chunkSize);
        
        if (resource === 'clientes') {
          // Special Upsert logic for Clientes using 'codigo' as unique key
          await getDb(env.DB)
            .insert(table)
            .values(chunk)
            .onConflictDoUpdate({
              target: table.codigo,
              set: {
                razon_social: sql`excluded.razon_social`,
                nombre_fantasia: sql`excluded.nombre_fantasia`,
                cuit: sql`excluded.cuit`,
                telefono: sql`excluded.telefono`,
                email: sql`excluded.email`,
                numero_circuito: sql`excluded.numero_circuito`,
                llamar_sn: sql`excluded.llamar_sn`,
                forma_contacto: sql`excluded.forma_contacto`,
              }
            });
        } else {
          await getDb(env.DB).insert(table).values(chunk);
        }
      }
      return { data: { success: true, count: transformedData.length } }
    } catch (error: any) {
      console.error('Error processing file from R2:', error);
      throw new Error(error.message || 'Error al procesar el archivo desde R2');
    }
  })

export const updateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const missingField = findMissingRequiredField(table, params.data, true);
    if (missingField) throw new Error(`VALIDATION_ERROR:required:${missingField}`);
    const transformedData = transformData(table, params.data);
    const updatedItems = await getDb(env.DB).update(table).set(transformedData).where(eq(table.id, params.id)).returning({ id: table.id })
    return { data: updatedItems[0] }
  })

export const updateManyFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const transformedData = transformData(table, params.data);
    await getDb(env.DB).update(table).set(transformedData).where(inArray(table.id, params.ids as any[]))
    return { data: params.ids }
  })

export const deleteFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const deletedItems = await getDb(env.DB).delete(table).where(eq(table.id, params.id)).returning({ id: table.id })
    return { data: deletedItems[0] }
  })

export const deleteManyFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    await getDb(env.DB).delete(table).where(inArray(table.id, params.ids as any[]))
    return { data: params.ids }
  })
