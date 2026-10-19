import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'config.json');
const defaultConfig = {
  location: { name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' },
  growatt: { server: 'https://openapi.growatt.com/v1', apiToken: '' }
};
let solarCache = { until: 0, value: null };

async function getConfig() {
  try {
    const saved = JSON.parse(await fs.readFile(configPath, 'utf8'));
    return {
      ...defaultConfig,
      ...saved,
      location: { ...defaultConfig.location, ...saved.location },
      growatt: {
        ...defaultConfig.growatt,
        ...saved.growatt,
        server: saved.growatt?.server ?? saved.growatt?.apiBase ?? defaultConfig.growatt.server,
        apiToken: saved.growatt?.apiToken ?? saved.growatt?.token ?? saved.growatt?.thirdPartyKey ?? ''
      }
    };
  }
  catch { return defaultConfig; }
}

async function getText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'MorningDesk/1.0 (personal dashboard)' } });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response.text();
}

function decode(value = '') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim();
}

function tag(block, name) {
  const result = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return result ? decode(result[1]) : '';
}

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
  const pv = finite(numeric(find('ppv', 'pvPower', 'pv_power', 'pPv', 'solar', 'solarPower')));
  const consumption = finite(numeric(find('outPutPower', 'outputPower', 'loadPower', 'load_power', 'pLoad', 'pload', 'powerToLoad', 'pToLoad', 'userPower', 'houseLoad', 'sysOut', 'pAcOutPut')));
  const pDischarge = finite(numeric(find('pDischarge', 'batteryDischargePower', 'battery_discharge_power', 'pdisCharge', 'pdischarge', 'pDischarge1', 'pdisCharge1', 'pdischarge1')));
  const pCharge = finite(numeric(find('pCharge', 'batteryChargePower', 'battery_charge_power', 'pcharge', 'pCharge1')));
  const pBat = finite(numeric(find('pBat', 'pbat', 'batteryPower', 'battery_power')));
  let battery = pDischarge;
  let batteryCharge = pCharge;
  if ((battery == null || battery === 0) && pBat != null && pBat < -20) batteryCharge = Math.abs(pBat);
  if ((battery == null || battery === 0) && pBat != null && pBat > 20) battery = pBat;
  if (batteryCharge == null) batteryCharge = 0;
  if (battery == null) battery = 0;
  const grid = finite(numeric(find('pAcInPut', 'pacInput', 'gridImportPower', 'grid_import_power', 'pGridImport', 'pgridImport', 'importPower', 'gridImport', 'pToUser', 'pacToUser', 'gridPower', 'grid_power', 'pGrid', 'pgrid')));
  const batteryPercent = finite(numeric(find('capacity', 'batteryPercent', 'battery_percent', 'batterySoc', 'battery_soc', 'soc', 'SOC', 'soc1', 'bmsSoc')));
  const batteryVoltage = finite(numeric(find('vBat', 'vbat', 'batteryVoltage', 'battery_voltage', 'batVoltage', 'bat_voltage', 'vBattery')));
  const flowPv = Number.isFinite(pv) && pv >= 20;
  const flowGrid = Number.isFinite(grid) && grid >= 20;
  const flowBatteryOut = Number.isFinite(battery) && battery >= 20;
  const flowBatteryIn = Number.isFinite(batteryCharge) && batteryCharge >= 20;
  const flowLoad = Number.isFinite(consumption) && consumption >= 20;
  const candidates = [['PV', pv], ['BATTERY', battery], ['GRID', grid]].filter(([, value]) => Number.isFinite(value) && Math.abs(value) >= 20);
  const activeSource = candidates.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? 'STANDBY';
  const feeding = [];
  if (flowPv) feeding.push(`PV ${Math.round(pv)}W`);
  if (flowGrid) feeding.push(`Grid ${Math.round(grid)}W`);
  if (flowBatteryOut) feeding.push(`Battery ${Math.round(battery)}W`);
  const sinking = [];
  if (flowLoad) sinking.push(`Load ${Math.round(consumption)}W`);
  if (flowBatteryIn) sinking.push(`Charge ${Math.round(batteryCharge)}W`);
  const flowSummary = [feeding.length ? feeding.join(' + ') : 'No source', sinking.length ? sinking.join(' \u00b7 ') : 'Idle'].join(' \u2192 ');
  const statusRaw = find('spf5000StatusText', 'statusText', 'status', 'plantStatus');
  const status = statusRaw == null ? 'Connected' : String(statusRaw);
  return {
    plant: find('plantName', 'name', 'plant_name') ?? 'Growatt system',
    power: finite(numeric(find('ppv', 'pac', 'power', 'currentPower', 'current_power', 'powerKw'))),
    today: finite(numeric(find('todayEnergy', 'todayYield', 'today_energy', 'eToday', 'etoday', 'epvToday'))),
    total: finite(numeric(find('totalEnergy', 'totalYield', 'total_energy', 'eTotal', 'etotal', 'epvTotal'))),
    status, updatedAt: find('time', 'updateTime', 'lastUpdateTime', 'last_update_time', 'updatedAt') ?? null,
    pv, grid, battery, batteryCharge, batteryPercent, batteryVoltage, consumption, activeSource, flowSummary,
    flowPv, flowGrid, flowBatteryOut, flowBatteryIn, flowLoad,
    hasFlowData: [pv, consumption, battery, batteryCharge, grid].some(Number.isFinite)
  };
}

function openApiBase(server) {
  const value = (server || '').replace(/\/+$/, '');
  if (!value || /:\/\/server(?:-[a-z]+)?\.growatt\.com$/i.test(value)) return 'https://openapi.growatt.com/v1';
  return /\/v1$/i.test(value) ? value : `${value}/v1`;
}

async function growattOpenApiRequest(baseUrl, endpoint, token, params = {}) {
  const url = new URL(`${baseUrl}/${endpoint.replace(/^\/+/, '')}`);
  for (const [name, value] of Object.entries(params)) if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  const response = await fetch(url, { headers: { token, Accept: 'application/json', 'User-Agent': 'MorningDesk/1.0 (personal dashboard)' } });
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
    headers: { token, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'User-Agent': 'MorningDesk/1.0 (personal dashboard)' },
    body: new URLSearchParams({ deviceType, deviceSn }).toString()
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

const app = express();
app.use(express.json());
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/', (_req, res) => {
  const index = path.join(publicDir, 'index.html');
  res.sendFile(index, err => { if (err) res.status(500).send(`Morning Desk index missing at ${index}`); });
});
app.get('/api/config', async (_req, res) => {
  const config = await getConfig();
  res.json({ location: config.location, growattConfigured: Boolean(config.growatt?.apiToken), growattServer: openApiBase(config.growatt?.server) });
});
app.put('/api/config', async (req, res) => {
  const previous = await getConfig();
  const next = {
    location: { ...previous.location, ...req.body.location },
    growatt: { ...previous.growatt, ...(req.body.growatt?.server ? { server: req.body.growatt.server } : {}), ...(req.body.growatt?.apiToken ? { apiToken: req.body.growatt.apiToken.trim() } : {}) }
  };
  await fs.writeFile(configPath, JSON.stringify(next, null, 2));
  solarCache = { until: 0, value: null };
  res.json({ ok: true });
});
app.get('/api/weather', async (_req, res) => {
  try {
    const { location } = await getConfig();
    const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, timezone: location.timezone, current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset', forecast_days: '5' });
    const data = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`).then(r => r.json());
    res.json({ location: location.name, ...data });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
app.get('/api/news', async (_req, res) => {
  try {
    const xml = await getText('https://www.dailymaverick.co.za/dmrss/');
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 7).map(match => ({ title: tag(match[1], 'title'), link: tag(match[1], 'link'), published: tag(match[1], 'pubDate') }));
    res.json({ items });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
app.get('/api/cnn', async (_req, res) => {
  try {
    let xml;
    try { xml = await getText('https://rss.cnn.com/rss/cnn_latest.rss'); }
    catch { xml = await getText('https://news.google.com/rss/search?q=site%3Acnn.com&hl=en-ZA&gl=ZA&ceid=ZA%3Aen'); }
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 7).map(match => ({ title: tag(match[1], 'title'), link: tag(match[1], 'link'), published: tag(match[1], 'pubDate') }));
    res.json({ items });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
app.get('/api/solar', async (_req, res) => {
  try {
    if (solarCache.until > Date.now()) return res.status(solarCache.value?.error ? 429 : 200).json(solarCache.value);
    const { growatt } = await getConfig();
    if (!growatt?.apiToken) return res.json({ configured: false });
    const baseUrl = openApiBase(growatt.server);
    const plantList = await growattOpenApiRequest(baseUrl, 'plant/list', growatt.apiToken, { page: '', perpage: '', search_type: '', search_keyword: '' });
    const plant = pickPlant(plantList);
    if (!plant) throw new Error('The API token is valid, but it does not have access to a Growatt plant.');
    const plantId = plant.plantId ?? plant.plant_id ?? plant.id;
    if (!plantId) throw new Error('Growatt did not return a plant ID for this token.');
    const plantData = await growattOpenApiRequest(baseUrl, 'plant/data', growatt.apiToken, { plant_id: plantId });
    let liveDeviceData = [];
    try {
      const deviceList = await growattOpenApiRequest(baseUrl, 'device/list', growatt.apiToken, { plant_id: plantId, page: '', perpage: '' });
      const devices = pickDevices(deviceList).slice(0, 6);
      liveDeviceData = (await Promise.all(devices.map(device => growattLatestDeviceData(baseUrl, growatt.apiToken, device).catch(() => ({}))))).filter(data => Object.keys(data).length);
    } catch {}
    const readings = normaliseSolar({ ...plant, ...(plantData ?? {}), liveDevices: liveDeviceData, ...(liveDeviceData[0] ?? {}) });
    const previous = solarCache.value ?? {};
    const value = !readings.hasFlowData ? { configured: true, ...readings, pv: previous.pv ?? readings.pv, grid: previous.grid ?? readings.grid, battery: previous.battery ?? readings.battery, batteryCharge: previous.batteryCharge ?? readings.batteryCharge, batteryPercent: previous.batteryPercent ?? readings.batteryPercent, batteryVoltage: previous.batteryVoltage ?? readings.batteryVoltage, consumption: previous.consumption ?? readings.consumption, activeSource: previous.activeSource ?? readings.activeSource, flowSummary: previous.flowSummary ?? readings.flowSummary, flowPv: previous.flowPv ?? readings.flowPv, flowGrid: previous.flowGrid ?? readings.flowGrid, flowBatteryOut: previous.flowBatteryOut ?? readings.flowBatteryOut, flowBatteryIn: previous.flowBatteryIn ?? readings.flowBatteryIn, flowLoad: previous.flowLoad ?? readings.flowLoad } : { configured: true, ...readings };
    solarCache = { until: Date.now() + 15 * 60 * 1000, value };
    res.json(value);
  } catch (error) {
    const errorMessage = /frequently_access/i.test(error.message) ? 'Growatt has temporarily rate-limited this API token. The widget will wait 15 minutes before trying again.' : /permission_denied/i.test(error.message) ? 'Growatt accepted the token but has not authorized it for this plant.' : error.message;
    const value = { configured: true, error: errorMessage };
    solarCache = { until: Date.now() + 15 * 60 * 1000, value };
    res.status(502).json(value);
  }
});
app.get('/api/sky', async (_req, res) => {
  try {
    const html = await getText('https://www.youtube.com/@SkyNews/live');
    const match = html.match(/"videoId":"([^"\\]+)"/);
    if (!match) throw new Error('Sky News does not have an active YouTube stream right now.');
    res.json({ videoId: match[1] });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
const PORT = Number(process.env.PORT) || 4123;
const HOST = process.env.HOST || '0.0.0.0';
function lanAddresses() {
  try {
    const nets = os.networkInterfaces();
    const out = [];
    for (const list of Object.values(nets)) {
      for (const net of list || []) {
        if (net.family === 'IPv4' && !net.internal) out.push(net.address);
      }
    }
    return out;
  } catch { return []; }
}
app.listen(PORT, HOST, () => {
  console.log(`Morning Desk listening on http://${HOST}:${PORT}`);
  console.log(`  Public:  ${publicDir}`);
  console.log(`  Local:   http://127.0.0.1:${PORT}`);
  for (const ip of lanAddresses()) console.log(`  Network: http://${ip}:${PORT}`);
});
