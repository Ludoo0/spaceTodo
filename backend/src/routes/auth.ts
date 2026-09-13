import { Router } from "express";
import { getOidcClient, generators } from "../auth.js";
import { prisma } from "../db.js";

const router = Router();

router.get("/login", async (req, res, next) => {
  try {
    const client = await getOidcClient();
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);
    const state = generators.state();
    const nonce = generators.nonce();

    req.session.oidc = { code_verifier, state, nonce };

    const url = client.authorizationUrl({
      scope: process.env.OIDC_SCOPES || "openid profile email",
      state,
      nonce,
      code_challenge,
      code_challenge_method: "S256",
    });

    res.redirect(url);
  } catch (err) {
    next(err);
  }
});

router.get("/callback", async (req, res, next) => {
  try {
    const client = await getOidcClient();
    const pending = req.session.oidc;
    if (!pending) {
      return res.status(400).send("Login-Session abgelaufen. Bitte erneut einloggen.");
    }

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(process.env.OIDC_REDIRECT_URI!, params, {
      code_verifier: pending.code_verifier,
      state: pending.state,
      nonce: pending.nonce,
    });

    const userinfo = await client.userinfo(tokenSet);

    const user = await prisma.user.upsert({
      where: { oidcSub: userinfo.sub },
      update: {
        email: userinfo.email ?? undefined,
        name: (userinfo.name as string) ?? userinfo.preferred_username ?? undefined,
      },
      create: {
        oidcSub: userinfo.sub,
        email: userinfo.email ?? undefined,
        name: (userinfo.name as string) ?? userinfo.preferred_username ?? undefined,
      },
    });

    delete req.session.oidc;
    req.session.userId = user.id;

    res.redirect(process.env.FRONTEND_URL || "/");
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("spacetodo.sid");
    res.json({ ok: true });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "unauthenticated" });
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  res.json({ id: user.id, email: user.email, name: user.name });
});

export default router;
