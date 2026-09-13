import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { Note, Space, Todo } from "../types";
import TodoList from "../components/TodoList";
import StickyNotes from "../components/StickyNotes";
import { debounce } from "../utils/debounce";
import { debounceManager } from "../utils/debounceManager";

export default function SpacePage() {
    const { id } = useParams<{ id: string }>();
    const [space, setSpace] = useState<Space | null>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteUpdateQueue] = useState(() => new Map<string, Partial<Note>>());
    const [debouncedNoteUpdates] = useState(() => new Map<string, ReturnType<typeof debounce>>());

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

    // Cleanup debounced operations on unmount
    useEffect(() => {
        return () => {
            // Flush all pending note updates
            for (const debouncedFn of debouncedNoteUpdates.values()) {
                debouncedFn.flush();
            }
            debouncedNoteUpdates.clear();
            noteUpdateQueue.clear();
        };
    }, [debouncedNoteUpdates, noteUpdateQueue]);

    function getOrCreateDebouncedNoteUpdate(noteId: string) {
        if (!debouncedNoteUpdates.has(noteId)) {
            const debouncedFn = debounce(() => {
                const patch = noteUpdateQueue.get(noteId);
                if (patch && Object.keys(patch).length > 0) {
                    api.notes.update(noteId, patch).catch(console.error);
                    noteUpdateQueue.delete(noteId);
                }
            }, 500);

            debouncedNoteUpdates.set(noteId, debouncedFn);

            // Register with global manager for page unload
            debounceManager.register({
                id: `note-update-${noteId}`,
                flush: () => debouncedFn.flush(),
            });
        }
        return debouncedNoteUpdates.get(noteId)!;
    }

    function changeLayout(layout: "grid" | "free") {
        if (!space) return;
        setSpace({ ...space, noteLayout: layout });
        api.spaces.update(space.id, { noteLayout: layout });
    }

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
                    layout={space?.noteLayout || "grid"}
                    onLayoutChange={changeLayout}
                    onAdd={(color) => api.notes.create(id, { color }).then(loadNotes)}
                    onChange={(note, patch) => {
                        // Update UI immediately (optimistic update)
                        setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, ...patch } : n)));
                        // Queue the patch and debounce the API call
                        const existing = noteUpdateQueue.get(note.id) || {};
                        noteUpdateQueue.set(note.id, { ...existing, ...patch });
                        const debouncedUpdate = getOrCreateDebouncedNoteUpdate(note.id);
                        debouncedUpdate();
                    }}
                    onDragEnd={(note) => {
                        // Flush immediately after dragging ends for better UX
                        const debouncedUpdate = debouncedNoteUpdates.get(note.id);
                        debouncedUpdate?.flush();
                    }}
                    onRemove={(note) => api.notes.remove(note.id).then(loadNotes)}
                />
            </section>
        </div>
    );
}
