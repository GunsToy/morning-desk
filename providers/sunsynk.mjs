// Sunsynk Connect adapter (Sunsynk inverters, and Deye inverters registered on Sunsynk Connect).
// Sunsynk has no API tokens: this signs in with the same email and password as the Sunsynk Connect app.
// The API is unofficial; the 2025 sign-in below (password RSA-encrypted with the server's key, requests signed
// with an MD5 of a nonce) follows the open-source Predbat project, which talks to it in production.
import crypto from 'node:crypto';
import { USER_AGENT, FETCH_TIMEOUT_MS, summariseFlow, numberOrNull, splitBatteryPower } from './common.mjs';

const CLIENT_ID = 'csp-web';
// Sunsynk's servers. The server is picked from this list, never typed, so nobody can point it at another machine.
const SERVERS = [
  { value: 'https://api.sunsynk.net', label: 'Sunsynk Connect (sunsynk.net)' },
  { value: 'https://pv.inteless.com', label: 'Inteless (older accounts, pv.inteless.com)' }
];
const SOURCE = { 'https://api.sunsynk.net': 'sunsynk', 'https://pv.inteless.com': 'elinter' };
const DEFAULT_SERVER = SERVERS[0].value;

const md5 = text => crypto.createHash('md5').update(text).digest('hex');

async function call(server, path, { method = 'GET', token, query = {}, body } = {}) {
  const url = new URL(path, server);
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, String(value));
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(`Sunsynk returned ${response.status}.`);
  if (data.success === false || (data.code !== undefined && Number(data.code) !== 0)) {
    throw new Error(data.msg ? `Sunsynk: ${data.msg}` : 'Sunsynk refused the request.');
  }
  return data.data;
}

// The server sends its RSA public key as base64 DER: usually SubjectPublicKeyInfo, sometimes a bare PKCS#1 key.
function publicKeyFrom(base64) {
  const der = Buffer.from(base64, 'base64');
  try { return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' }); }
  catch { return crypto.createPublicKey({ key: der, format: 'der', type: 'pkcs1' }); }
}

export async function signIn(server, username, password) {
  const source = SOURCE[server];
  const nonce = Date.now();
  const sign = suffix => md5(`nonce=${nonce}&source=${source}${suffix}`);
  const publicKey = String(await call(server, '/anonymous/publicKey', { query: { source, nonce, sign: sign('POWER_VIEW') } }) ?? '');
  if (!publicKey) throw new Error('Sunsynk did not send its sign-in key.');
  const encrypted = crypto.publicEncrypt({ key: publicKeyFrom(publicKey), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(password, 'utf8'))
    .toString('base64');
  const token = await call(server, '/oauth/token/new', {
    method: 'POST',
    body: { client_id: CLIENT_ID, grant_type: 'password', password: encrypted, source, username, nonce, sign: sign(publicKey.slice(0, 10)) }
  });
  if (!token?.access_token) throw new Error('Sunsynk did not return a sign-in token. Check the email and password.');
  return token.access_token;
}

export function readingsFrom(inverter, { battery: bat = {}, grid: gridData = {}, load = {}, input = {} }) {
  const pv = numberOrNull(input.pac);
  // shortcut: Sunsynk's signs are taken from its inverter registers (grid positive = import, battery positive =
  // discharging), not from documentation; if a live system shows them backwards, flip them here.
  const gridNet = numberOrNull(gridData.pac);
  const grid = gridNet === null ? null : Math.max(0, gridNet);
  const consumption = numberOrNull(load.totalPower);
  const { battery, batteryCharge } = splitBatteryPower(numberOrNull(bat.power), true);
  return {
    plant: inverter.plant?.name || inverter.alias || 'Sunsynk system',
    status: null,
    updatedAt: null,
    power: pv,
    today: numberOrNull(input.etoday),
    total: numberOrNull(input.etotal),
    pv,
    grid,
    gridVoltage: numberOrNull(gridData.vip?.[0]?.volt),
    battery,
    batteryCharge,
    batteryPercent: numberOrNull(bat.soc),
    batteryVoltage: numberOrNull(bat.voltage),
    consumption,
    ...summariseFlow({ pv, grid, battery, batteryCharge, consumption })
  };
}

export default {
  id: 'sunsynk',
  label: 'Sunsynk / Deye',
  fields: [
    { name: 'server', label: 'Sunsynk server', type: 'select', options: SERVERS, required: true },
    { name: 'username', label: 'Sunsynk Connect email', type: 'text', placeholder: 'The email you sign in to the Sunsynk Connect app with', maxLength: 120 },
    { name: 'password', label: 'Sunsynk Connect password', type: 'password', secret: true }
  ],

  defaults: () => ({ server: DEFAULT_SERVER, username: '', password: '' }),

  clean: (raw = {}) => ({
    server: SERVERS.some(item => item.value === raw.server) ? raw.server : DEFAULT_SERVER,
    username: String(raw.username ?? ''),
    password: String(raw.password ?? '')
  }),

  isConfigured: settings => Boolean(settings.username && settings.password),

  async fetchReadings({ server, username, password }) {
    const base = SERVERS.some(item => item.value === server) ? server : DEFAULT_SERVER;
    const token = await signIn(base, username, password);
    const list = await call(base, '/api/v1/inverters', { token, query: { page: 1, limit: 10, type: -2, status: -1 } });
    const inverter = list?.infos?.find(item => item?.sn);
    if (!inverter) throw new Error('This Sunsynk account has no inverters.');
    const sn = encodeURIComponent(inverter.sn);
    const [battery, grid, load, input] = await Promise.all([
      call(base, `/api/v1/inverter/battery/${sn}/realtime`, { token, query: { sn: inverter.sn, lan: 'en' } }),
      call(base, `/api/v1/inverter/grid/${sn}/realtime`, { token, query: { sn: inverter.sn } }),
      call(base, `/api/v1/inverter/load/${sn}/realtime`, { token, query: { sn: inverter.sn } }),
      call(base, `/api/v1/inverter/${sn}/realtime/input`, { token, query: { sn: inverter.sn } })
    ]);
    return readingsFrom(inverter, { battery: battery ?? {}, grid: grid ?? {}, load: load ?? {}, input: input ?? {} });
  },

  explainError: error => error.name === 'TimeoutError'
    ? 'Sunsynk did not answer within 15 seconds. The widget will try again in 15 minutes.'
    : error.message
};
