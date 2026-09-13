import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { Note, Space, Todo } from "../types";
import TodoList from "../components/TodoList";
import StickyNotes from "../components/StickyNotes";

export default function SpacePage() {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const loadTodos = () => {
    if (id) api.todos.listForSpace(id).then(setTodos);
  };
  const loadNotes = () => {
    if (id) api.notes.listForSpace(id).then(setNotes);
  };

  useEffect(() => {
    if (!id) return;
    api.spaces.list().then((spaces) => setSpace(spaces.find((s) => s.id === id) || null));
    loadTodos();
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return null;

  return (
    <div className="page" style={{ ["--space-color" as any]: space?.color }}>
      <header className="page-header">
        <p className="eyebrow-plain">Space</p>
        <h1>{space?.name || "…"}</h1>
      </header>

      <section className="space-section">
        <h2 className="section-title">Todos</h2>
        <TodoList
          todos={todos}
          onAdd={(title) => api.todos.create(id, title).then(loadTodos)}
          onToggleDone={(t) => api.todos.update(t.id, { done: !t.done }).then(loadTodos)}
          onTogglePriority={(t) => api.todos.update(t.id, { priority: !t.priority }).then(loadTodos)}
          onRemove={(t) => api.todos.remove(t.id).then(loadTodos)}
          emptyLabel="Noch keine Todos in diesem Space."
        />
      </section>

      <section className="space-section">
        <StickyNotes
          notes={notes}
          onAdd={(color) => api.notes.create(id, { color }).then(loadNotes)}
          onChange={(note, patch) => {
            setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, ...patch } : n)));
            api.notes.update(note.id, patch);
          }}
          onRemove={(note) => api.notes.remove(note.id).then(loadNotes)}
        />
      </section>
    </div>
  );
}
