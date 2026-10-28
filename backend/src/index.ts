import "dotenv/config";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import pg from "pg";

import { sequelize } from "@/config/db.ts";
import { env } from "@/config/env";
import authRoutes from "@/routes/auth";
import noteRoutes from "@/routes/notes";
import spaceRoutes from "@/routes/spaces";
import todoRoutes from "@/routes/todos";
import { doubleCsrfProtection, generateCsrfToken } from "@/security/csrf";
import { apiLimiter, authLimiter } from "@/security/rateLimit";

const app = express();
const PgSession = connectPgSimple(session);

const pgPool = new pg.Pool({ connectionString: env.DATABASE_URL });

app.set("trust proxy", 1);
app.use(express.json());
const allowedOrigins = (env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    name: "spacetodo.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.COOKIE_SECURE,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  }),
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
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "EBADCSRFTOKEN"
    ) {
      return res
        .status(403)
        .json({ error: "Ungültiges CSRF-Token. Bitte Seite neu laden." });
    }
    console.error(err);
    const message = err instanceof Error ? err.message : undefined;
    res.status(500).json({ error: message || "Interner Serverfehler" });
  },
);

const port = env.PORT;

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
