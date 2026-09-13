import { useEffect, useState } from "react";
import { api } from "../api";
import type { Todo } from "../types";
import TodoList from "../components/TodoList";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const load = () => api.todos.priority().then(setTodos);

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow-plain">Übersicht</p>
        <h1>Was heute wichtig ist</h1>
        <p className="page-sub">
          Alle Todos, die du in deinen Spaces mit einem Stern markiert hast, laufen hier zusammen.
        </p>
      </header>

      <TodoList
        todos={todos}
        showSpaceTag
        emptyLabel="Noch keine priorisierten Todos. Markiere in einem Space ein Todo mit ★, damit es hier erscheint."
        onToggleDone={(t) => api.todos.update(t.id, { done: !t.done }).then(load)}
        onTogglePriority={(t) => api.todos.update(t.id, { priority: !t.priority }).then(load)}
        onRemove={(t) => api.todos.remove(t.id).then(load)}
      />
    </div>
  );
}
