import { useRef, useState } from "react";
import type { Note } from "../types";

const COLORS = ["#F2C14E", "#E8836B", "#8FAE8B", "#7FA8C9", "#B49CD1"];

interface Props {
  notes: Note[];
  onAdd: (color: string) => void;
  onChange: (note: Note, patch: Partial<Note>) => void;
  onRemove: (note: Note) => void;
}

export default function StickyNotes({ notes, onAdd, onChange, onRemove }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  function startDrag(e: React.PointerEvent, note: Note) {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - note.x,
      y: e.clientY - rect.top - note.y,
    };
    setDragging(note.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDrag(e: React.PointerEvent, note: Note) {
    if (dragging !== note.id) return;
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 190, e.clientX - rect.left - dragOffset.current.x));
    const y = Math.max(0, e.clientY - rect.top - dragOffset.current.y);
    onChange(note, { x, y });
  }

  function endDrag(note: Note) {
    setDragging(null);
  }

  return (
    <div className="corkboard-wrap">
      <div className="corkboard-header">
        <h2>Notizen</h2>
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
      <div className="corkboard" ref={boardRef}>
        {notes.length === 0 && (
          <p className="empty-hint corkboard-empty">
            Klicke auf eine Farbe oben, um deinen ersten Zettel anzuheften.
          </p>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className="sticky-note"
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
              onPointerUp={() => endDrag(n)}
            >
              <button className="sticky-note-remove" onClick={() => onRemove(n)}>
                ×
              </button>
            </div>
            <textarea
              value={n.content}
              placeholder="Notiz …"
              onChange={(e) => onChange(n, { content: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
