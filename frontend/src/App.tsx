import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { api } from "./api";
import type { User } from "./types";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import SpacePage from "./pages/SpacePage";

export default function App() {
    const [user, setUser] = useState<User | null | undefined>(undefined);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        api
            .me()
            .then(setUser)
            .catch(() => setUser(null));
    }, []);

    if (user === undefined) {
        return <div className="boot-screen">wird geladen …</div>;
    }

    if (user === null) {
        return (
            <div className="login-screen">
                <div className="login-card">
                    <h1>SpaceTodo</h1>
                    <p>Ein ruhiger Ort für deine Todos und Notizen &mdash; sortiert nach Lebensbereich.</p>
                    <a className="btn btn-primary" href="/auth/login">
                        Anmelden
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="shell">
            <button
                className="mobile-topbar-toggle"
                aria-label="Menü öffnen"
                onClick={() => setSidebarOpen(true)}
            >
                ☰ <span className="brand-mark">◆</span> SpaceTodo
            </button>

            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

            <Sidebar user={user} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

            <main className="content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/space/:id" element={<SpacePage />} />
                </Routes>
            </main>
        </div>
    );
}
