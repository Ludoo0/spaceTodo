import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Space, User } from "../types";

const PALETTE = ["#3E7C6B", "#C97B4A", "#7FA8C9", "#B49CD1", "#D9A441", "#8FAE8B"];

interface SidebarProps {
    user: User;
    open?: boolean;
    onNavigate?: () => void;
}

export default function Sidebar({ user, open, onNavigate }: SidebarProps) {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    const load = () => api.spaces.list().then(setSpaces);

    useEffect(() => {
        load();
    }, []);

    async function createSpace(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        const color = PALETTE[spaces.length % PALETTE.length];
        await api.spaces.create({ name: name.trim(), color });
        setName("");
        setAdding(false);
        load();
    }

    function startEdit(space: Space) {
        setEditingId(space.id);
        setEditValue(space.name);
    }

    async function commitEdit() {
        if (!editingId) return;
        const trimmed = editValue.trim();
        const id = editingId;
        setEditingId(null);
        if (trimmed) {
            await api.spaces.update(id, { name: trimmed });
            load();
        }
    }

    async function move(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= spaces.length) return;
        const a = spaces[index];
        const b = spaces[target];
        const next = [...spaces];
        next[index] = b;
        next[target] = a;
        setSpaces(next); // optimistic
        await Promise.all([
            api.spaces.update(a.id, { position: target }),
            api.spaces.update(b.id, { position: index }),
        ]);
        load();
    }

    async function removeSpace(space: Space) {
        const ok = window.confirm(
            `"${space.name}" wirklich löschen? Alle Todos und Notizen darin gehen unwiderruflich verloren.`
        );
        if (!ok) return;
        await api.spaces.remove(space.id);
        if (location.pathname === `/space/${space.id}`) {
            navigate("/");
        }
        load();
    }

    return (
        <aside className={"sidebar" + (open ? " open" : "")}>
            <div className="brand">
                <span className="brand-mark">◆</span>
                <span>SpaceTodo</span>
            </div>

            <NavLink
                to="/"
                end
                onClick={onNavigate}
                className={({ isActive }) => "nav-item nav-home" + (isActive ? " active" : "")}
            >
                Übersicht
            </NavLink>

            <div className="sidebar-label">Deine Bereiche</div>
            <nav className="space-list">
                {spaces.map((s, i) => (
                    <div key={s.id} className="space-row" style={{ ["--space-color" as any]: s.color }}>
                        <div className="space-order-btns">
                            <button
                                className="order-btn"
                                disabled={i === 0}
                                aria-label="nach oben"
                                onClick={() => move(i, -1)}
                            >
                                ▲
                            </button>
                            <button
                                className="order-btn"
                                disabled={i === spaces.length - 1}
                                aria-label="nach unten"
                                onClick={() => move(i, 1)}
                            >
                                ▼
                            </button>
                        </div>

                        {editingId === s.id ? (
                            <input
                                autoFocus
                                className="space-edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEdit();
                                    if (e.key === "Escape") setEditingId(null);
                                }}
                            />
                        ) : (
                            <NavLink
                                to={`/space/${s.id}`}
                                onClick={onNavigate}
                                className={({ isActive }) => "nav-item space-item" + (isActive ? " active" : "")}
                            >
                                <span className="space-dot" />
                                {s.name}
                            </NavLink>
                        )}

                        <div className="space-row-actions">
                            <button className="icon-btn" title="Umbenennen" onClick={() => startEdit(s)}>
                                ✎
                            </button>
                            <button className="icon-btn icon-btn-danger" title="Löschen" onClick={() => removeSpace(s)}>
                                🗑
                            </button>
                        </div>
                    </div>
                ))}
            </nav>

            {adding ? (
                <form className="add-space-form" onSubmit={createSpace}>
                    <input
                        autoFocus
                        placeholder="z. B. Job, Garten, Musik …"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => !name && setAdding(false)}
                    />
                </form>
            ) : (
                <button className="add-space-btn" onClick={() => setAdding(true)}>
                    + Neuer Space
                </button>
            )}

            <div className="sidebar-footer">
                <div className="user-name">{user.name || user.email || "Konto"}</div>
                <button
                    className="logout-btn"
                    onClick={() => api.logout().then(() => (window.location.href = "/"))}
                >
                    Abmelden
                </button>
            </div>
        </aside>
    );
}
