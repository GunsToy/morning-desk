// "Sign in with Poodle House": OpenID Connect's authorization-code flow, done on the server.
// Off unless all of these are set (docker-compose.yml passes them through from .env):
//   SSO_ISSUER         the provider, e.g. https://poodlehouse.co.za/
//   SSO_CLIENT_ID      e.g. morning-desk
//   SSO_CLIENT_SECRET  the secret the provider holds for this client
//   SSO_PUBLIC_URL     where this dashboard is reached, e.g. https://morningdesk.poodlehouse.co.za
//   SSO_NAME           button text: "Sign in with <name>" (default Poodle House)
//   SSO_ADMIN_GROUP    members of this group sign in as the house admin (default house-admin)
import { USER_AGENT, FETCH_TIMEOUT_MS } from './providers/common.mjs';

const env = process.env;
export const name = env.SSO_NAME || 'Poodle House';
export const adminGroup = env.SSO_ADMIN_GROUP || 'house-admin';
export const publicUrl = env.SSO_PUBLIC_URL || '';
export const enabled = Boolean(env.SSO_ISSUER && env.SSO_CLIENT_ID && env.SSO_CLIENT_SECRET && publicUrl);
export const redirectUri = enabled ? new URL('/auth/sso/callback', publicUrl).href : '';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...options.headers }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) throw new Error(`${new URL(url).pathname} answered ${response.status}`);
  return body;
}

let discovery = null; // the provider's endpoints, fetched once an hour at most
async function endpoints() {
  if (discovery && discovery.until > Date.now()) return discovery.value;
  const value = await fetchJson(new URL('.well-known/openid-configuration', env.SSO_ISSUER.replace(/\/?$/, '/')).href);
  discovery = { value, until: Date.now() + 60 * 60 * 1000 };
  return value;
}

export async function authorizeUrl(state) {
  const url = new URL((await endpoints()).authorization_endpoint);
  url.search = new URLSearchParams({ response_type: 'code', client_id: env.SSO_CLIENT_ID, redirect_uri: redirectUri, scope: 'openid profile groups', state }).toString();
  return url.href;
}

// Trades the one-time code for the person's details: { username, groups }.
// The code is only good with our client secret, and the details come straight from the provider over HTTPS,
// so the id_token's signature does not need checking here.
export async function identify(code) {
  const { token_endpoint: tokenUrl, userinfo_endpoint: userinfoUrl } = await endpoints();
  const tokens = await fetchJson(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: env.SSO_CLIENT_ID, client_secret: env.SSO_CLIENT_SECRET })
  });
  if (!tokens.access_token) throw new Error('The provider sent no access token.');
  const claims = await fetchJson(userinfoUrl, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const username = String(claims.preferred_username ?? claims.username ?? '').trim().toLowerCase();
  if (!username) throw new Error('The provider did not say who signed in.');
  return { username, groups: Array.isArray(claims.groups) ? claims.groups.map(String) : [] };
}
