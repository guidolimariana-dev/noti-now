import { createFileRoute } from '@tanstack/react-router'
import { type Todo } from '@/db/schema'
import { getTodos } from '@/functions/get-todos'

export const Route = createFileRoute('/todos' as any)({
  loader: async () => await getTodos(),
  component: TodosComponent,
});

function TodosComponent() {
  const todos: Todo[] = Route.useLoaderData();

  return (
    <div className="p-2">
      <h1 className="text-xl font-bold">Todo List</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className={todo.completo ? 'line-through' : ''}>
            {todo.descripcion}
          </li>
        ))}
      </ul>
    </div>
  );
}
