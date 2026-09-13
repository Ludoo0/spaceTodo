import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oidc?: {
      code_verifier: string;
      state: string;
      nonce: string;
    };
  }
}
