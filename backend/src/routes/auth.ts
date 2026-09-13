import { Router } from "express";
import { getOidcClient, generators } from "../auth.js";
import { User } from "../db.js";
import { v4 as uuidv4 } from "uuid";

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

    const [user] = await User.findOrCreate({
      where: { oidcSub: userinfo.sub as string },
      defaults: {
        id: uuidv4(),
        oidcSub: userinfo.sub as string,
        email: userinfo.email as string | undefined,
        name: ((userinfo.name as string) ?? userinfo.preferred_username) as string | undefined,
      },
    });

    await user.update({
      email: userinfo.email as string | undefined,
      name: ((userinfo.name as string) ?? userinfo.preferred_username) as string | undefined,
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
  const user = await User.findByPk(req.session.userId);
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  res.json({ id: user.id, email: user.email, name: user.name });
});

export default router;
