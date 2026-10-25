// Growatt OpenAPI adapter. The functions below are the original Growatt code, moved here unchanged.
import { USER_AGENT, FETCH_TIMEOUT_MS } from './common.mjs';

// Growatt's regional OpenAPI servers. These are the only addresses ever called: the region is picked from
// this list, never typed, so nobody with a profile can point the server at another machine.
const SERVERS = [
  { value: 'https://openapi.growatt.com/v1', label: 'Other regions (Europe, Africa, Asia)' },
  { value: 'https://openapi-cn.growatt.com/v1', label: 'China' },
  { value: 'https://openapi-us.growatt.com/v1', label: 'North America' },
  { value: 'https://openapi-au.growatt.com/v1', label: 'Australia and New Zealand' }
];
const DEFAULT_SERVER = SERVERS[0].value;

function normaliseSolar(payload) {
  const source = payload.data ?? payload;
  const first = Array.isArray(source) ? source[0] : (source.plants?.[0] ?? source.plant ?? source);
  const findDeep = (value, names, seen = new Set()) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return undefined;
    seen.add(value);
    for (const name of names) if (value[name] !== undefined && value[name] !== null) return value[name];
    for (const child of Object.values(value)) { const found = findDeep(child, names, seen); if (found !== undefined) return found; }
    return undefined;
  };
  const find = (...names) => findDeep(first, names);
  const numeric = value => value === undefined || value === null || value === '' ? null : Number(value);
  const finite = value => Number.isFinite(value) ? value : null;

  // Storage / hybrid devices (SPF, SPH, etc.) use different keys from pure inverters.
  const pv = finite(numeric(find('ppv', 'pvPower', 'pv_power', 'pPv', 'solar', 'solarPower')));
  const consumption = finite(numeric(find(
    'outPutPower', 'outputPower', 'loadPower', 'load_power', 'pLoad', 'pload',
    'powerToLoad', 'pToLoad', 'userPower', 'houseLoad', 'sysOut', 'pAcOutPut'
  )));
  // Explicit discharge / charge fields. Signed pBat: negative = charging on many Growatt storage models.
  const pDischarge = finite(numeric(find(
    'pDischarge', 'batteryDischargePower', 'battery_discharge_power', 'pdisCharge', 'pdischarge',
    'pDischarge1', 'pdisCharge1', 'pdischarge1'
  )));
  const pCharge = finite(numeric(find('pCharge', 'batteryChargePower', 'battery_charge_power', 'pcharge', 'pCharge1')));
  const pBat = finite(numeric(find('pBat', 'pbat', 'batteryPower', 'battery_power')));
  let battery = pDischarge; // discharge power shown on the battery node when discharging
  let batteryCharge = pCharge;
  if ((battery == null || battery === 0) && pBat != null && pBat < -20) batteryCharge = Math.abs(pBat);
  if ((battery == null || battery === 0) && pBat != null && pBat > 20) battery = pBat;
  if (batteryCharge == null) batteryCharge = 0;
  if (battery == null) battery = 0;

  const grid = finite(numeric(find(
    'pAcInPut', 'pacInput', 'gridImportPower', 'grid_import_power', 'pGridImport', 'pgridImport',
    'importPower', 'gridImport', 'pToUser', 'pacToUser', 'gridPower', 'grid_power', 'pGrid', 'pgrid'
  )));
  const batteryPercent = finite(numeric(find(
    'capacity', 'batteryPercent', 'battery_percent', 'batterySoc', 'battery_soc', 'soc', 'SOC', 'soc1', 'bmsSoc'
  )));
  const batteryVoltage = finite(numeric(find(
    'vBat', 'vbat', 'batteryVoltage', 'battery_voltage', 'batVoltage', 'bat_voltage', 'vBattery'
  )));

  const flowPv = Number.isFinite(pv) && pv >= 20;
  const flowGrid = Number.isFinite(grid) && grid >= 20;
  const flowBatteryOut = Number.isFinite(battery) && battery >= 20;
  const flowBatteryIn = Number.isFinite(batteryCharge) && batteryCharge >= 20;
  const flowLoad = Number.isFinite(consumption) && consumption >= 20;

  const candidates = [
    ['PV', pv],
    ['BATTERY', battery],
    ['GRID', grid]
  ].filter(([, value]) => Number.isFinite(value) && Math.abs(value) >= 20);
  const activeSource = candidates.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? 'STANDBY';

  // Human-readable list of everything currently contributing / consuming
  const feeding = [];
  if (flowPv) feeding.push(`PV ${Math.round(pv)}W`);
  if (flowGrid) feeding.push(`Grid ${Math.round(grid)}W`);
  if (flowBatteryOut) feeding.push(`Battery ${Math.round(battery)}W`);
  const sinking = [];
  if (flowLoad) sinking.push(`Load ${Math.round(consumption)}W`);
  if (flowBatteryIn) sinking.push(`Charge ${Math.round(batteryCharge)}W`);
  const flowSummary = [
    feeding.length ? feeding.join(' + ') : 'No source',
    sinking.length ? sinking.join(' · ') : 'Idle'
  ].join(' → ');

  const statusRaw = find('spf5000StatusText', 'statusText', 'status', 'plantStatus');
  const status = statusRaw == null ? 'Connected' : String(statusRaw);

  return {
    plant: find('plantName', 'name', 'plant_name') ?? 'Growatt system',
    power: finite(numeric(find('ppv', 'pac', 'power', 'currentPower', 'current_power', 'powerKw'))),
    today: finite(numeric(find('todayEnergy', 'todayYield', 'today_energy', 'eToday', 'etoday', 'epvToday'))),
    total: finite(numeric(find('totalEnergy', 'totalYield', 'total_energy', 'eTotal', 'etotal', 'epvTotal'))),
    status,
    updatedAt: find('time', 'updateTime', 'lastUpdateTime', 'last_update_time', 'updatedAt') ?? null,
    pv,
    grid,
    battery,
    batteryCharge,
    batteryPercent,
    batteryVoltage,
    consumption,
    activeSource,
    flowSummary,
    // Flow flags drive animated arrows on the diagram
    flowPv,
    flowGrid,
    flowBatteryOut,
    flowBatteryIn,
    flowLoad,
    hasFlowData: [pv, consumption, battery, batteryCharge, grid].some(Number.isFinite)
  };
}

function openApiBase(server) {
  const value = (server || '').replace(/\/+$/, '');
  // The older ShineServer URL cannot authenticate OpenAPI tokens. Upgrade it automatically.
  if (!value || /:\/\/server(?:-[a-z]+)?\.growatt\.com$/i.test(value)) return 'https://openapi.growatt.com/v1';
  const base = /\/v1$/i.test(value) ? value : `${value}/v1`;
  // Anything saved before the region list existed that is not one of Growatt's servers falls back to the default.
  return SERVERS.some(server => server.value === base) ? base : DEFAULT_SERVER;
}

async function growattOpenApiRequest(baseUrl, endpoint, token, params = {}) {
  const url = new URL(`${baseUrl}/${endpoint.replace(/^\/+/, '')}`);
  for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  const response = await fetch(url, {
    headers: { token, Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Growatt OpenAPI returned ${response.status}. Check the selected regional OpenAPI address.`);
  let body;
  try { body = JSON.parse(text); }
  catch { throw new Error('Growatt OpenAPI returned an unexpected response. Check the OpenAPI address and token.'); }
  if (Number(body.error_code ?? 0) !== 0) throw new Error(body.error_msg || `Growatt rejected the API token (error ${body.error_code}).`);
  return body.data;
}

async function growattLatestDeviceData(baseUrl, token, device) {
  const typeMap = { 1: 'inverter', 2: 'storage', 4: 'max', 5: 'sph', 6: 'spa', 7: 'min', 8: 'pcs', 9: 'hps', 10: 'pbd' };
  const deviceSn = device.device_sn ?? device.deviceSn ?? device.serialNum ?? device.sn;
  const rawType = device.device_type ?? device.deviceType ?? device.type;
  const deviceType = typeof rawType === 'string' && !/^\d+$/.test(rawType) ? rawType.toLowerCase() : typeMap[Number(rawType)];
  if (!deviceSn || !deviceType) return {};
  const origin = new URL(baseUrl).origin;
  const response = await fetch(`${origin}/v4/new-api/queryLastData`, {
    method: 'POST',
    headers: {
      token,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': USER_AGENT
    },
    body: new URLSearchParams({ deviceType, deviceSn }).toString(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) return {};
  const body = await response.json().catch(() => null);
  if (!body || Number(body.code ?? body.error_code ?? 0) !== 0) return {};
  const readings = body.data?.[deviceType] ?? body.data?.[Object.keys(body.data ?? {})[0]] ?? body.data;
  return Array.isArray(readings) ? readings[0] ?? {} : readings ?? {};
}

function pickPlant(listResponse) {
  const source = listResponse.data ?? listResponse;
  const lists = [source.rows, source.list, source.records, source.plants, source.plantList, source.data, source];
  return lists.find(value => Array.isArray(value) && value.length)?.[0] ?? null;
}

function pickDevices(listResponse) {
  const source = listResponse?.data ?? listResponse ?? {};
  const lists = [source.devices, source.rows, source.list, source.records, source.data, source];
  return lists.find(value => Array.isArray(value) && value.length) ?? [];
}

export default {
  id: 'growatt',
  label: 'Growatt',
  fields: [
    { name: 'server', label: 'Growatt region', type: 'select', options: SERVERS, required: true },
    { name: 'apiToken', label: 'API token', type: 'password', secret: true, placeholder: 'Paste your OpenAPI token' }
  ],

  defaults: () => ({ server: DEFAULT_SERVER, apiToken: '' }),

  // Earlier versions stored these values under other names; keep reading them.
  clean: (raw = {}) => ({
    server: openApiBase(raw.server ?? raw.apiBase),
    apiToken: raw.apiToken ?? raw.token ?? raw.thirdPartyKey ?? ''
  }),

  isConfigured: settings => Boolean(settings.apiToken),

  // Show the address that will really be called (an old ShineServer address is upgraded automatically).
  publicValues: settings => ({ server: openApiBase(settings.server) }),

  async fetchReadings({ server, apiToken }) {
    const baseUrl = openApiBase(server);
    const plantList = await growattOpenApiRequest(baseUrl, 'plant/list', apiToken, { page: '', perpage: '', search_type: '', search_keyword: '' });
    const plant = pickPlant(plantList);
    if (!plant) throw new Error('The API token is valid, but it does not have access to a Growatt plant. Give the token access to the account that owns the plant.');
    const plantId = plant.plantId ?? plant.plant_id ?? plant.id;
    if (!plantId) throw new Error('Growatt did not return a plant ID for this token.');
    const plantData = await growattOpenApiRequest(baseUrl, 'plant/data', apiToken, { plant_id: plantId });
    // The plant endpoint is the reliable baseline. Current device data adds load, PV, battery and grid flow when available.
    let liveDeviceData = [];
    try {
      const deviceList = await growattOpenApiRequest(baseUrl, 'device/list', apiToken, { plant_id: plantId, page: '', perpage: '' });
      const devices = pickDevices(deviceList).slice(0, 6);
      liveDeviceData = (await Promise.all(devices.map(device => growattLatestDeviceData(baseUrl, apiToken, device).catch(() => ({}))))).filter(data => Object.keys(data).length);
    } catch { /* Some Growatt models do not expose the v4 live-flow endpoint. */ }
    // Spread the primary live device last so storage/hybrid fields (ppv, outPutPower, pAcInPut, capacity, pDischarge)
    // take priority over coarser plant-level values.
    return normaliseSolar({ ...plant, ...(plantData ?? {}), liveDevices: liveDeviceData, ...(liveDeviceData[0] ?? {}) });
  },

  explainError: error => error.name === 'TimeoutError'
    ? 'Growatt did not answer within 15 seconds. The widget will try again in 15 minutes.'
    : /frequently_access/i.test(error.message)
      ? 'Growatt has temporarily rate-limited this API token. The widget will wait 15 minutes before trying again.'
      : /permission_denied/i.test(error.message)
        ? 'Growatt accepted the token but has not authorized it for this plant. Create a new OpenAPI token for the account that owns the plant, or ask the installer to authorize OpenAPI access.'
        : error.message
};
