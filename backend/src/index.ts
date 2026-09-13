import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import cookieParser from "cookie-parser";
import pg from "pg";

import { sequelize } from "./db.js";
import { apiLimiter, authLimiter } from "./security/rateLimit.js";
import { doubleCsrfProtection, generateCsrfToken } from "./security/csrf.js";
import authRoutes from "./routes/auth.js";
import spaceRoutes from "./routes/spaces.js";
import todoRoutes from "./routes/todos.js";
import noteRoutes from "./routes/notes.js";

const app = express();
const PgSession = connectPgSimple(session);

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.set("trust proxy", 1);
app.use(express.json());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || true,
        credentials: true,
    })
);

app.use(
    session({
        store: new PgSession({ pool: pgPool, tableName: "session", createTableIfMissing: true }),
        name: "spacetodo.sid",
        secret: process.env.SESSION_SECRET || "change-me-in-production",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.COOKIE_SECURE === "true",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        },
    })
);

// cookie-parser must come after express-session (session parses its own cookie)
app.use(cookieParser());

// CSRF protection for every state-changing request (POST/PATCH/PUT/DELETE).
// GET/HEAD/OPTIONS are left untouched automatically.
app.use(doubleCsrfProtection);

// The frontend calls this once (after confirming it's logged in) to obtain a
// token, then attaches it as the "x-csrf-token" header on every mutation.
app.get("/auth/csrf-token", (req, res) => {
    res.json({ csrfToken: generateCsrfToken(req, res) });
});

app.use("/api", apiLimiter);
app.use(["/auth/login", "/auth/callback"], authLimiter);

app.use("/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/notes", noteRoutes);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.code === "EBADCSRFTOKEN") {
        return res.status(403).json({ error: "Ungültiges CSRF-Token. Bitte Seite neu laden." });
    }
    console.error(err);
    res.status(500).json({ error: err?.message || "Interner Serverfehler" });
});

const port = Number(process.env.PORT) || 4000;

(async () => {
    try {
        // Sync database
        await sequelize.sync({ alter: true });
        console.log("Datenbank synchronisiert");

        app.listen(port, () => {
            console.log(`spacetodo backend läuft auf Port ${port}`);
        });
    } catch (error) {
        console.error("Fehler beim Starten des Servers:", error);
        process.exit(1);
    }
})();
