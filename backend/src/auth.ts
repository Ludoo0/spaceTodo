import { type Client, generators, Issuer } from "openid-client";
import { env } from "@/config/env";

let client: Client | null = null;

export async function getOidcClient(): Promise<Client> {
  if (client) return client;

  const issuerUrl = env.OIDC_ISSUER_URL;
  const clientId = env.OIDC_CLIENT_ID;
  const clientSecret = env.OIDC_CLIENT_SECRET;
  const redirectUri = env.OIDC_REDIRECT_URI;

  const issuer = await Issuer.discover(issuerUrl);
  client = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
  });

  return client;
}

export { generators };
