import rateLimit from "express-rate-limit";

// General API limiter. Keyed by logged-in user where possible (falls back to IP
// for unauthenticated requests) so one heavy user can't starve others behind
// the same NAT/reverse proxy, and so legitimate rapid-fire actions (e.g. typing
// into a sticky note, which autosaves on every keystroke) don't get blocked.
export const apiLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 300,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => req.session?.userId || req.ip || "anonymous",
	message: { error: "Zu viele Anfragen. Bitte kurz warten und erneut versuchen." },
});

// Stricter limiter for the OIDC login/callback endpoints to slow down
// automated abuse of the authentication flow.
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: "Zu viele Login-Versuche. Bitte kurz warten und erneut versuchen." },
});
