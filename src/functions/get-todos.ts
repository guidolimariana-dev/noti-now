import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { type Todo, todosTable } from '../db/schema'
import { getDb } from '../db'

export const getTodos = createServerFn({ method: 'GET' })
  .handler(async (): Promise<Todo[]> => {
    try {
      return await getDb(env.DB).select().from(todosTable).all()
    } catch (error) {
      console.error('D1 Query Error:', error)
      throw new Error('Failed to fetch todos')
    }
  })
