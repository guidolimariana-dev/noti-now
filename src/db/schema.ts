import { int, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { type InferSelectModel } from 'drizzle-orm'

export const todosTable = sqliteTable("todos", {
  id: int().primaryKey({ autoIncrement: true }),
  descripcion: text().notNull(),
  completo: integer({ mode: 'boolean' }).notNull().default(false),
});

export type Todo = InferSelectModel<typeof todosTable>
