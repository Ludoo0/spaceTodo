import { doubleCsrf } from "csrf-csrf";

// Double-submit-cookie CSRF protection. The session cookie already uses
// SameSite=Lax, which blocks the classic cross-site form/fetch CSRF vector,
// but this adds an explicit, defense-in-depth token check for all
// state-changing requests (everything except GET/HEAD/OPTIONS).
//
// Flow: the frontend fetches a token once via GET /auth/csrf-token and sends
// it back as the "x-csrf-token" header on every POST/PATCH/DELETE request.
export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
	getSecret: () => process.env.SESSION_SECRET || "change-me-in-production",
	getSessionIdentifier: (req) => req.session.id,
	cookieName: "spacetodo.csrf",
	cookieOptions: {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.COOKIE_SECURE === "true",
		path: "/",
	},
	getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string | undefined,
});
