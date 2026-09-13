import { useState } from "react";
import type { Todo } from "../types";

interface Props {
  todos: Todo[];
  onAdd?: (title: string) => void;
  onToggleDone: (todo: Todo) => void;
  onTogglePriority: (todo: Todo) => void;
  onRemove: (todo: Todo) => void;
  showSpaceTag?: boolean;
  emptyLabel?: string;
}

export default function TodoList({
  todos,
  onAdd,
  onToggleDone,
  onTogglePriority,
  onRemove,
  showSpaceTag,
  emptyLabel,
}: Props) {
  const [draft, setDraft] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !onAdd) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div className="notepad">
      {onAdd && (
        <form className="todo-add-row" onSubmit={submit}>
          <input
            placeholder="Neues Todo …"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn btn-small">
            Hinzufügen
          </button>
        </form>
      )}

      {todos.length === 0 && <p className="empty-hint">{emptyLabel || "Keine Todos."}</p>}

      <ul className="todo-list">
        {todos.map((t) => (
          <li key={t.id} className={"todo-row" + (t.done ? " done" : "")}>
            <button
              className="todo-check"
              aria-label="erledigt umschalten"
              onClick={() => onToggleDone(t)}
            >
              {t.done ? "✓" : ""}
            </button>
            <span className="todo-title">{t.title}</span>
            {showSpaceTag && t.space && (
              <span className="todo-space-tag" style={{ ["--space-color" as any]: t.space.color }}>
                {t.space.name}
              </span>
            )}
            <button
              className={"todo-star" + (t.priority ? " active" : "")}
              title="Priorität umschalten"
              onClick={() => onTogglePriority(t)}
            >
              ★
            </button>
            <button className="todo-remove" title="löschen" onClick={() => onRemove(t)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
