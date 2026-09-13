import { useRef } from "react";
import type { Note } from "../types";

const COLORS = ["#F2C14E", "#E8836B", "#8FAE8B", "#7FA8C9", "#B49CD1"];

interface Props {
  notes: Note[];
  onAdd: (color: string) => void;
  onChange: (note: Note, patch: Partial<Note>) => void;
  onRemove: (note: Note) => void;
}

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function StickyNotes({ notes, onAdd, onChange, onRemove }: Props) {
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

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

        {notes.length === 0 ? (
            <p className="empty-hint corkboard-empty">
              Klicke auf eine Farbe oben, um deinen ersten Zettel anzuheften.
            </p>
        ) : (
            <div className="corkboard-grid">
              {notes.map((n) => (
                  <div key={n.id} className="sticky-note" style={{ background: n.color }}>
                    <button className="sticky-note-remove" onClick={() => onRemove(n)} aria-label="Notiz löschen">
                      ×
                    </button>
                    <textarea
                        ref={(el) => {
                          textareaRefs.current[n.id] = el;
                          autoGrow(el);
                        }}
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
      </div>
  );
}
