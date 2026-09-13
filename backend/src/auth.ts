import { Issuer, generators, type Client } from "openid-client";

let client: Client | null = null;

export async function getOidcClient(): Promise<Client> {
  if (client) return client;

  const issuerUrl = process.env.OIDC_ISSUER_URL;
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  const redirectUri = process.env.OIDC_REDIRECT_URI;

  if (!issuerUrl || !clientId || !redirectUri) {
    throw new Error(
      "OIDC ist nicht konfiguriert. Bitte OIDC_ISSUER_URL, OIDC_CLIENT_ID und OIDC_REDIRECT_URI setzen."
    );
  }

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
