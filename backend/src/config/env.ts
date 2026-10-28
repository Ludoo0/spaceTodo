import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url().refine(
    (value) => {
      const url = new URL(value);
      return url.protocol === "postgresql:" || url.protocol === "postgres:";
    },
    { message: "Invalid PostgreSQL connection URL" },
  ),
  SESSION_SECRET: z.string(),
  COOKIE_SECURE: z.coerce.boolean(),
  FRONTEND_URL: z.url(),
  OIDC_ISSUER_URL: z.httpUrl(),
  OIDC_CLIENT_ID: z.string(),
  OIDC_CLIENT_SECRET: z.string(),
  OIDC_REDIRECT_URI: z.url(),
  OIDC_SCOPES: z.string().optional().default("openid profile email"),
  PORT: z.coerce.number().optional().default(4000),
});

export const env = envSchema.parse(process.env);
