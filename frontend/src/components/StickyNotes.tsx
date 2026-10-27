import { useEffect, useRef, useState } from "react";
import type { Note } from "@/types";

const COLORS = ["#F2C14E", "#E8836B", "#8FAE8B", "#7FA8C9", "#B49CD1"];
const FREE_BOARD_WIDTH = 1000;

interface Props {
  notes: Note[];
  layout: "grid" | "free";
  onLayoutChange: (layout: "grid" | "free") => void;
  onAdd: (color: string) => void;
  onChange: (note: Note, patch: Partial<Note>) => void;
  onRemove: (note: Note) => void;
  onDragEnd?: (note: Note) => void;
}

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function StickyNotes({ notes, layout, onLayoutChange, onAdd, onChange, onRemove, onDragEnd }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Mirrors the latest `notes` prop so the window-level listeners (registered
  // once per drag, see below) always read fresh note data instead of a
  // stale closure from whichever render happened to be active when the
  // drag started.
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Offset between the pointer and the note's top-left corner at drag start.
  // Kept in a ref (not state) so it never triggers a re-render and is always
  // read fresh inside the window listeners below.
  const dragOffset = useRef({ x: 0, y: 0 });

  function startDrag(e: React.PointerEvent, note: Note) {
    const board = boardRef.current;
    if (!board) return;
    e.preventDefault();
    const rect = board.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left - note.x, y: e.clientY - rect.top - note.y };
    setDragging(note.id);
  }

  function onDrag(e: React.PointerEvent, note: Note) {
    if (dragging !== note.id) return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 200, e.clientX - rect.left - dragOffset.current.x));
    const y = Math.max(0, e.clientY - rect.top - dragOffset.current.y);
    onChange(note, { x, y });
  }

  // Attaching the move/up listeners to `window` (rather than relying on
  // per-element setPointerCapture, which can get out of sync across fast
  // re-renders) is what makes dragging fully free in every direction -
  // including up past wherever the note happened to be created.
  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: PointerEvent) {
      const board = boardRef.current;
      if (!board) return;
      const note = notesRef.current.find((n) => n.id === dragging);
      if (!note) return;

      const rect = board.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 200, e.clientX - rect.left - dragOffset.current.x));
      const y = Math.max(0, e.clientY - rect.top - dragOffset.current.y);
      onChange(note, { x, y });
    }

    function handleUp() {
      const note = notesRef.current.find((n) => n.id === dragging);
      setDragging(null);
      if (note) onDragEnd?.(note);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return (
      <div className="corkboard-wrap">
        <div className="corkboard-header">
          <h2>Notizen</h2>
          <div className="corkboard-controls">
            <div className="layout-toggle">
              <button
                  className={"layout-toggle-btn" + (layout === "grid" ? " active" : "")}
                  onClick={() => onLayoutChange("grid")}
              >
                Raster
              </button>
              <button
                  className={"layout-toggle-btn" + (layout === "free" ? " active" : "")}
                  onClick={() => onLayoutChange("free")}
              >
                Frei
              </button>
            </div>
            <div className="note-color-picker">
              {COLORS.map((c) => (
                  <button
                      key={c}
                      className="color-swatch"
                      style={{ background: c }}
                      onClick={() => onAdd(c)}
                      title="Notiz hinzufügen"
                  />
              ))}
            </div>
          </div>
        </div>

        {notes.length === 0 && (
            <p className="empty-hint corkboard-empty">
              Klicke auf eine Farbe oben, um deinen ersten Zettel anzuheften.
            </p>
        )}

        {notes.length > 0 && layout === "grid" && (
            <div className="corkboard-grid">
              {notes.map((n) => (
                  <div key={n.id} className="sticky-note" style={{ background: n.color }}>
                    <button className="sticky-note-remove" onClick={() => onRemove(n)} aria-label="Notiz löschen">
                      ×
                    </button>
                    <textarea
                        ref={autoGrow}
                        value={n.content}
                        placeholder="Notiz …"
                        rows={1}
                        onChange={(e) => {
                          autoGrow(e.target);
                          onChange(n, { content: e.target.value });
                        }}
                    />
                  </div>
              ))}
            </div>
        )}

        {notes.length > 0 && layout === "free" && (
            <div className="corkboard-scroll">
              <div className="corkboard-canvas" ref={boardRef} style={{ minWidth: FREE_BOARD_WIDTH }}>
                {notes.map((n) => (
                    <div
                        key={n.id}
                        className="sticky-note sticky-note-free"
                        style={{
                          left: n.x,
                          top: n.y,
                          background: n.color,
                          transform: `rotate(${n.rotation}deg)`,
                          zIndex: dragging === n.id ? 10 : 1,
                        }}
                    >
                      <div
                          className="sticky-note-handle"
                          onPointerDown={(e) => startDrag(e, n)}
                          onPointerMove={(e) => onDrag(e, n)}
                          onPointerUp={() => {
                            setDragging(null);
                            onDragEnd?.(n);
                          }}
                      >
                        <button className="sticky-note-remove" onClick={() => onRemove(n)} aria-label="Notiz löschen">
                          ×
                        </button>
                      </div>
                      <textarea
                          ref={autoGrow}
                          value={n.content}
                          placeholder="Notiz …"
                          rows={1}
                          onChange={(e) => {
                            autoGrow(e.target);
                            onChange(n, { content: e.target.value });
                          }}
                      />
                    </div>
                ))}
              </div>
            </div>
        )}
      </div>
  );
}
