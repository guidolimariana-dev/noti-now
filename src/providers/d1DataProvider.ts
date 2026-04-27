import { getListFn, getOneFn, getManyFn, getManyReferenceFn, createFn, updateFn, updateManyFn, deleteFn, deleteManyFn } from '@/server/db-functions'

const fieldLabels: Record<string, string> = {
  codigo: 'Código',
  nombre: 'Nombre',
  estado: 'Estado',
  fecha_envio: 'Fecha Envío',
  fecha_limite: 'Fecha Límite',
  id_recorrido: 'Recorrido',
};

const formatErrorMessage = (error: any) => {
  if (error.message && error.message.startsWith('VALIDATION_ERROR:')) {
    const [, type, field] = error.message.split(':');
    if (type === 'required') {
      const label = fieldLabels[field] || (field.charAt(0).toUpperCase() + field.slice(1));
      return `Campo faltante. Es necesario que complete el campo '${label}' para guardar los cambios.`;
    }
  }
  return error.message || 'Error desconocido';
};

export const dataProvider = {
  getList: async (resource: string, params: any) => {
    const result = await getListFn({ data: { resource, params } })
    return result
  },

  getOne: async (resource: string, params: any) => {
    const result = await getOneFn({ data: { resource, params } })
    return result
  },

  getMany: async (resource: string, params: any) => {
    const result = await getManyFn({ data: { resource, params } })
    return result
  },

  getManyReference: async (resource: string, params: any) => {
    const result = await getManyReferenceFn({ data: { resource, params } })
    return result
  },

  create: async (resource: string, params: any) => {
    try {
      const result = await createFn({ data: { resource, params } })
      return result
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  },

  update: async (resource: string, params: any) => {
    try {
      const result = await updateFn({ data: { resource, params } })
      return result
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  },

  updateMany: async (resource: string, params: any) => {
    const result = await updateManyFn({ data: { resource, params } })
    return result
  },

  delete: async (resource: string, params: any) => {
    const result = await deleteFn({ data: { resource, params } })
    return result
  },

  deleteMany: async (resource: string, params: any) => {
    const result = await deleteManyFn({ data: { resource, params } })
    return result
  },

}

