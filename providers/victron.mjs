// Victron VRM adapter (Cerbo GX / Venus OS systems, via the VRM cloud portal).
//
// One request to /installations/{id}/diagnostics returns the latest value of every data attribute in the system.
// Each record looks like (from a real response):
//   { idSite, timestamp, Device: 'VE.Bus System', instance: 276, idDataAttribute: 325, description: 'Inverter To AcOut',
//     formatWithUnit: '%.2F kWh', dbusServiceType: 'vebus', dbusPath: '/Energy/InverterToAcOut', code: 't9',
//     formattedValue: '1.04 kWh', rawValue: '1.04', id: 96 }
// Records are matched by attribute id or code, never by position, because list order and widget keys change.
//
// HOW CERTAIN IS EACH MATCH
//   Confirmed in public examples: the record layout above, code SOC (battery charge), code Pdc (PV power), code o1 (load).
//   Taken from the VRM attribute ids used by a Home Assistant integration: 47/49/51 (battery), 107/94 (solar charger),
//   205/209/213 (PV inverter power L1-L3), 379/380/381 (grid meter power L1-L3).
//   Not yet checked against a live system: how a given installation combines them. Use "Check connection" in Settings
//   to list every data point your installation reports, then adjust the table below if something is missing.

import { buildReadings } from './common.mjs';

const BASE = 'https://vrmapi.victronenergy.com/v2';
const USER_AGENT = 'MorningDesk/1.0 (personal dashboard)';
const TIMEOUT_MS = 20_000;
const STALE_AFTER_S = 30 * 60; // VRM can lag by a few minutes; beyond this we say how old the data is
const SITE_NAME_TTL_MS = 24 * 60 * 60 * 1000;

// ---- What to look for ----------------------------------------------------------------------
const ATTR = {
  soc: 51,
  voltage: 47,
  current: 49,
  solarChargerBatteryWatts: 107,
  solarChargerYieldToday: 94,
  pvInverterPower: [205, 209, 213], // L1, L2, L3
  gridMeterPower: [379, 380, 381]   // L1, L2, L3 (positive = importing)
};
const CODE = {
  soc: 'SOC',
  batteryCurrent: 'I',
  pvDc: 'Pdc',       // PV power, DC-coupled
  solarCharger: 'PVP',
  load: ['o1', 'o2', 'o3'] // AC output power per phase
};

// ---- Talking to VRM ------------------------------------------------------------------------
function explainStatus(status, retryAfter) {
  if (status === 401) return 'Victron VRM rejected the access token. Create a new one in VRM under Preferences → Integrations → Access tokens and paste it into Settings.';
  if (status === 403) return 'This access token is not allowed to see that installation. Check the installation ID.';
  if (status === 404) return 'Victron VRM could not find that installation. Check the installation ID (the number in the address: vrm.victronenergy.com/installation/<id>/).';
  if (status === 429) return `Victron VRM is rate-limiting this token${retryAfter ? ` (try again in ${retryAfter}s)` : ''}. The widget will wait 15 minutes before trying again.`;
  return `Victron VRM returned ${status}. It will be tried again later.`;
}

async function vrmGet(path, token, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));
  let response;
  try {
    response = await fetch(url, {
      headers: { 'X-Authorization': `Token ${token}`, Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch (error) {
    throw new Error(error?.name === 'TimeoutError'
      ? 'Victron VRM did not answer in time. It will be tried again later.'
      : 'Could not reach Victron VRM. Check the server\'s internet connection.');
  }
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(explainStatus(response.status, response.headers.get('retry-after')));
  let body;
  try { body = await response.json(); }
  catch { throw new Error('Victron VRM returned an unexpected response.'); }
  if (body && body.success === false) throw new Error(`Victron VRM said: ${String(body.errors ?? body.error ?? 'request failed')}`);
  return body;
}

async function listInstallations(token) {
  const me = await vrmGet('/users/me', token);
  const userId = me?.user?.id ?? me?.idUser ?? me?.id;
  if (!userId) throw new Error('Victron VRM did not say which user this token belongs to.');
  const body = await vrmGet(`/users/${encodeURIComponent(userId)}/installations`, token);
  return Array.isArray(body?.records) ? body.records : [];
}

const siteNames = new Map(); // idSite -> { name, until }

async function resolveSite(token, installationId) {
  if (installationId) {
    const id = String(installationId);
    const known = siteNames.get(id);
    if (known && known.until > Date.now()) return { id, name: known.name };
    let name = `Victron site ${id}`;
    try { // the name is only for display, so a failure here is not fatal
      const site = (await listInstallations(token)).find(item => String(item.idSite) === id);
      if (site?.name) name = String(site.name);
    } catch { /* keep the fallback name */ }
    siteNames.set(id, { name, until: Date.now() + SITE_NAME_TTL_MS });
    return { id, name };
  }

  const sites = await listInstallations(token);
  if (sites.length === 0) throw new Error('This VRM account has no installations.');
  if (sites.length > 1) {
    const shown = sites.slice(0, 5).map(site => `${site.name ?? 'Unnamed'} (${site.idSite})`).join(', ');
    throw new Error(`This VRM account has ${sites.length} installations: ${shown}${sites.length > 5 ? ', …' : ''}. Enter the installation ID of the one to show.`);
  }
  return { id: String(sites[0].idSite), name: String(sites[0].name ?? `Victron site ${sites[0].idSite}`) };
}

async function fetchDiagnostics(token, siteId) {
  const body = await vrmGet(`/installations/${encodeURIComponent(siteId)}/diagnostics`, token, { count: 1000 });
  return normaliseRecords(body?.records);
}

// ---- Reading the records -------------------------------------------------------------------
function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normaliseRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.filter(record => record && typeof record === 'object').map(record => ({
    id: toNumber(record.idDataAttribute),
    code: String(record.code ?? ''),
    description: String(record.description ?? ''),
    device: String(record.Device ?? record.device ?? ''),
    service: String(record.dbusServiceType ?? ''),
    path: String(record.dbusPath ?? ''),
    instance: record.instance ?? null,
    timestamp: toNumber(record.timestamp) ?? 0,
    value: toNumber(record.rawValue) ?? toNumber(record.formattedValue),
    shown: record.formattedValue === undefined || record.formattedValue === null ? '' : String(record.formattedValue)
  }));
}

// Keeps only the newest record for each attribute on each device.
function latestPerAttribute(rows) {
  const newest = new Map();
  for (const row of rows) {
    const key = `${row.instance}|${row.id}|${row.code}|${row.path}`;
    const seen = newest.get(key);
    if (!seen || row.timestamp > seen.timestamp) newest.set(key, row);
  }
  return [...newest.values()];
}

const sum = rows => (rows.length ? rows.reduce((total, row) => total + row.value, 0) : null);
const newestOf = rows => rows.reduce((best, row) => (!best || row.timestamp > best.timestamp ? row : best), null);
const withValue = rows => rows.filter(row => row.value !== null);
const isBattery = row => row.service === 'battery' || /battery|bms/i.test(row.device);

function ageText(seconds) {
  if (seconds < 7200) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86400)} days`;
}

// Pure: turns diagnostics records into readings. `now` is in seconds.
export function readingsFromRecords(records, siteName, now = Date.now() / 1000) {
  const rows = withValue(records);

  const soc = newestOf(rows.filter(row => row.id === ATTR.soc || row.code === CODE.soc));
  const voltage = newestOf(rows.filter(row => row.id === ATTR.voltage || (row.service === 'battery' && row.path === '/Dc/0/Voltage')));
  const current = newestOf(rows.filter(row => row.id === ATTR.current || (row.code === CODE.batteryCurrent && isBattery(row)) || (row.service === 'battery' && row.path === '/Dc/0/Current')));

  // Victron reports battery current as positive when charging. Power is volts x amps.
  let battery = null;
  let batteryCharge = null;
  if (voltage && current) {
    const power = voltage.value * current.value;
    batteryCharge = power > 0 ? power : 0;
    battery = power < 0 ? -power : 0;
  }

  // Solar: the system-wide DC figure if there is one, otherwise the solar chargers added up. AC-coupled PV inverters are added on top.
  const dcSystem = sum(latestPerAttribute(rows.filter(row => row.code === CODE.pvDc)));
  const dcChargers = sum(latestPerAttribute(rows.filter(row => row.code === CODE.solarCharger || (row.service === 'solarcharger' && row.path === '/Yield/Power'))));
  const dcBatteryWatts = sum(latestPerAttribute(rows.filter(row => row.id === ATTR.solarChargerBatteryWatts)));
  const dc = dcSystem ?? dcChargers ?? dcBatteryWatts;
  const ac = sum(latestPerAttribute(rows.filter(row => ATTR.pvInverterPower.includes(row.id))));
  const pv = dc === null && ac === null ? null : (dc ?? 0) + (ac ?? 0);

  const load = sum(latestPerAttribute(rows.filter(row => CODE.load.includes(row.code))));

  // The grid meter reports negative power when exporting. The dashboard shows imports only.
  const gridTotal = sum(latestPerAttribute(rows.filter(row => ATTR.gridMeterPower.includes(row.id))));
  const grid = gridTotal === null ? null : Math.max(0, gridTotal);

  const today = sum(latestPerAttribute(rows.filter(row => row.id === ATTR.solarChargerYieldToday)));

  const newest = records.reduce((latest, row) => Math.max(latest, row.timestamp), 0);
  const age = newest ? now - newest : null;
  const recognised = [soc, voltage, current].some(Boolean) || [pv, load, gridTotal].some(value => value !== null);
  let status = 'Connected';
  if (!records.length) status = 'Connected, but VRM has no data yet';
  else if (!recognised) status = 'Connected, but no live values were recognised';
  else if (age !== null && age > STALE_AFTER_S) status = `Last data ${ageText(age)} ago`;

  return buildReadings({
    plant: siteName,
    status,
    updatedAt: newest ? `${new Date(newest * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC` : null,
    power: pv,
    today,
    pv,
    grid,
    battery,
    batteryCharge,
    batteryPercent: soc?.value ?? null,
    batteryVoltage: voltage?.value ?? null,
    consumption: load
  });
}

// ---- The adapter ---------------------------------------------------------------------------
export default {
  id: 'victron',
  label: 'Victron VRM',
  fields: [
    {
      name: 'accessToken', label: 'Access token', type: 'password', secret: true, placeholder: 'Paste your VRM access token',
      help: 'In VRM: Preferences → Integrations → Access tokens → Add. It gives read access to every installation on your account.'
    },
    {
      name: 'installationId', label: 'Installation ID (optional)', type: 'text', placeholder: 'Blank = your only installation',
      pattern: /^\d{1,12}$/, patternMessage: 'The installation ID is the number in the VRM address, for example 123456.', maxLength: 12,
      help: 'The number in vrm.victronenergy.com/installation/<id>/dashboard. Needed only if your account has more than one installation.'
    }
  ],

  defaults: () => ({ accessToken: '', installationId: '' }),

  clean: (raw = {}) => ({
    accessToken: typeof raw.accessToken === 'string' ? raw.accessToken : '',
    installationId: raw.installationId === undefined || raw.installationId === null ? '' : String(raw.installationId)
  }),

  isConfigured: settings => Boolean(settings.accessToken),

  async fetchReadings({ accessToken, installationId }) {
    const site = await resolveSite(accessToken, installationId);
    return readingsFromRecords(await fetchDiagnostics(accessToken, site.id), site.name);
  },

  async inspect({ accessToken, installationId }) {
    const site = await resolveSite(accessToken, installationId);
    const records = await fetchDiagnostics(accessToken, site.id);
    const readings = readingsFromRecords(records, site.name);
    const show = (label, value, unit) => `${label}: ${value === null ? 'NOT FOUND' : `${Math.round(value * 10) / 10} ${unit}`}`;
    return {
      lines: [
        `Connected to ${site.name} (installation ${site.id}). VRM reported ${records.length} data points. ${readings.status}.`,
        show('Battery charge', readings.batteryPercent, '%'),
        show('Battery voltage', readings.batteryVoltage, 'V'),
        show('Battery charging', readings.batteryCharge, 'W'),
        show('Battery discharging', readings.battery, 'W'),
        show('Solar', readings.pv, 'W'),
        show('Grid import', readings.grid, 'W'),
        show('House load', readings.consumption, 'W'),
        show('Solar today', readings.today, 'kWh'),
        ...(records.length && !readings.hasFlowData ? ['No live power values were recognised. Open the list below and send it to whoever maintains Morning Desk so the matching can be adjusted.'] : [])
      ],
      details: [...records]
        .sort((a, b) => a.device.localeCompare(b.device) || a.description.localeCompare(b.description))
        .map(row => `${row.device || '?'} #${row.instance ?? '?'} · ${row.description || '(no description)'} · code ${row.code || '-'} · id ${row.id ?? '-'} · ${row.shown || '-'}`)
    };
  },

  explainError: error => error.message
};
