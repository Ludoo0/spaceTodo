import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api";
import type { Space, User } from "../types";

const PALETTE = ["#3E7C6B", "#C97B4A", "#7FA8C9", "#B49CD1", "#D9A441", "#8FAE8B"];

export default function Sidebar({ user }: { user: User }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

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

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">◆</span>
        <span>Spaces</span>
      </div>

      <NavLink to="/" end className={({ isActive }) => "nav-item nav-home" + (isActive ? " active" : "")}>
        Übersicht
      </NavLink>

      <div className="sidebar-label">Deine Bereiche</div>
      <nav className="space-list">
        {spaces.map((s) => (
          <NavLink
            key={s.id}
            to={`/space/${s.id}`}
            className={({ isActive }) => "nav-item space-item" + (isActive ? " active" : "")}
            style={{ ["--space-color" as any]: s.color }}
          >
            <span className="space-dot" />
            {s.name}
          </NavLink>
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
