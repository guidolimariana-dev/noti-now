import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { eq, sql, asc, desc, inArray, and, or, like } from 'drizzle-orm'

const getTable = (resource: string): any => {
  // @ts-ignore
  const table = schema[resource];
  if (!table) throw new Error(`Resource "${resource}" not found in schema.`);
  return table;
};

export const getListFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const { page, perPage } = params.pagination
    const { field, order } = params.sort

    const filters = Object.entries(params.filter).map(([key, value]) => {
      if (key === 'q') {
        return undefined; // Handled separately
      }
      return eq(table[key], value)
    }).filter(Boolean)

    if (params.filter.q) {
      const searchQuery = String(params.filter.q).toLowerCase();

      const searchConditions = [];

      // Search by nombre (case-insensitive)
      searchConditions.push(like(sql`lower(${table.nombre})`, `%${searchQuery}%`));

      // Search by codigo (converting to text and partial match)
      searchConditions.push(like(sql`cast(${table.codigo} as text)`, `%${searchQuery}%`));

      if (searchConditions.length > 0) {
        filters.push(or(...searchConditions));
      }
    }

    const items = await getDb(env.DB)
      .select()
      .from(table)
      .where(filters.length ? and(...filters) : undefined)
      .limit(perPage)
      .offset((page - 1) * perPage)
      .orderBy(order === 'ASC' ? asc(table[field]) : desc(table[field]))

    const [countResult] = await getDb(env.DB)
      .select({ count: sql<number>`count(*)` })
      .from(table)

    return {
      data: items,
      total: Number(countResult.count),
    }
  })

export const getOneFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    const [item] = await getDb(env.DB)
      .select()
      .from(table)
      .where(eq(table.id, params.id))

    if (!item) throw new Error('Not found')

    return {
      data: item,
    }
  })

export const getManyFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)
    const { page, perPage } = params.pagination
    const { field, order } = params.sort

    const filters = [
      eq(table[params.target], params.id),
      ...Object.entries(params.filter).map(([key, value]) => eq(table[key], value))
    ]

    const items = await getDb(env.DB)
      .select()
      .from(table)
      .where(and(...filters))
      .limit(perPage)
      .offset((page - 1) * perPage)
      .orderBy(order === 'ASC' ? asc(table[field]) : desc(table[field]))

    const [countResult] = await getDb(env.DB)
      .select({ count: sql<number>`count(*)` })
      .from(table)
      .where(and(...filters));

    return {
      data: items,
      total: Number(countResult.count),
    }
  })

export const getManyReferenceFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    const items = await getDb(env.DB)
      .select()
      .from(table)
      .where(inArray(table.id, params.ids as any[]));
      
    return {
      data: items,
    }
  })

export const createFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    // Proactive validation
    const missingField = findMissingRequiredField(table, params.data, false);
    if (missingField) {
      throw new Error(`VALIDATION_ERROR:required:${missingField}`);
    }

    try {
      const items: {id: number}[] = await getDb(env.DB)
        .insert(table)
        .values(params.data)
        .returning({ id: table.id })

      return {
        data: items[0]
      }
    } catch (error: any) {
      throw error;
    }
    })

export const updateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    // Proactive validation
    const missingField = findMissingRequiredField(table, params.data, true);
    if (missingField) {
      throw new Error(`VALIDATION_ERROR:required:${missingField}`);
    }

    try {
      const updatedItems = await getDb(env.DB)
        .update(table)
        .set(params.data)
        .where(eq(table.id, params.id))
        .returning({ id: table.id })
        
      return {
        data: updatedItems[0]
      }
    } catch (error: any) {
      console.error("Error en updateFn:", error);
      throw error;
    }
  })

function findMissingRequiredField(table: any, data: any, isUpdate: boolean): string | undefined {
  // Drizzle tables store columns in different places depending on the version, 
  // but they are always available on the table object itself for standard definitions.
  for (const key in table) {
    const column = table[key];
    
    // Check if it looks like a Drizzle column
    if (column && typeof column === 'object' && (column.columnType || column.name)) {
      
      // Skip ID field as it's typically auto-incremented by the DB
      if (key === 'id') continue;

      // Check if the column is NOT NULL. 
      // In Drizzle, this is usually stored in column.notNull
      if (column.notNull) {
        const value = data[key];
        const isPresent = key in data;

        if (isUpdate) {
          // In update, only validate if the field is explicitly provided as null or empty
          if (isPresent && (value === null || value === undefined || (typeof value === 'string' && value.trim() === ''))) {
            return key;
          }
        } else {
          // In create, the field MUST be present and NOT null/empty
          if (!isPresent || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return key;
          }
        }
      }
    }
  }
  return undefined;
}
export const updateManyFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    await getDb(env.DB)
      .update(table)
      .set(params.data)
      .where(inArray(table.id, params.ids as any[]))
      
    return {
      data: params.ids
    }
  })

export const deleteFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    const deletedItems = await getDb(env.DB)
      .delete(table)
      .where(eq(table.id, params.id))
      .returning({ id: table.id })
      
    return {
      data: deletedItems[0]
    }
  })

export const deleteManyFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { resource: string, params: any}) => data)
  .handler(async ({ data }) => {
    const { resource, params } = data
    const table = getTable(resource)

    await getDb(env.DB)
      .delete(table)
      .where(inArray(table.id, params.ids as any[]))
      
    return {
      data: params.ids
    }
  })
