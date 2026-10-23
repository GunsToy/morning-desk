// Shared helpers for solar provider adapters.
//
// An adapter is a plain object:
//   id, label            - identifier stored in config.json, and the name shown in Settings
//   fields               - the credentials and options the user fills in (see below)
//   defaults()           - settings for a profile that has not configured this provider yet
//   clean(raw)           - turns whatever is stored on disk into current settings (read old names here)
//   isConfigured(s)      - true when there is enough to attempt a request
//   publicValues(s)      - OPTIONAL: the non-secret values the browser may see (defaults to the non-secret fields)
//   fetchReadings(s)     - asks the provider's cloud for live data and returns a readings object (see below)
//   explainError(e)      - OPTIONAL: turns an error from fetchReadings into a message for the dashboard
//   minIntervalMs        - OPTIONAL: never poll more often than this (the dashboard polls every 15 minutes)
//   inspect(s)           - OPTIONAL: backs the "Check connection" button. Returns { lines: [string], details?: [string] }.
//                          Without it the button simply runs fetchReadings and summarises the result.
//
// Each field is { name, label, type: 'url' | 'text' | 'password', secret?, required?, placeholder?, help?, maxLength?,
//                 pattern?: RegExp, patternMessage?: string }.
// Secret fields are write-only: the browser is told whether one is stored, never what it is.
//
// fetchReadings returns the same shape for every provider (watts unless noted; null when unknown):
//   plant, status, updatedAt, power, today (kWh), total (kWh),
//   pv, grid, battery (discharging W), batteryCharge (charging W), batteryPercent, batteryVoltage, consumption,
//   activeSource, flowSummary, flowPv, flowGrid, flowBatteryOut, flowBatteryIn, flowLoad, hasFlowData

export const USER_AGENT = 'MorningDesk/1.0 (personal dashboard)';

const FLOW_KEYS = [
  'pv', 'grid', 'battery', 'batteryCharge', 'batteryPercent', 'batteryVoltage', 'consumption',
  'activeSource', 'flowSummary', 'flowPv', 'flowGrid', 'flowBatteryOut', 'flowBatteryIn', 'flowLoad'
];

// When a poll comes back without any live flow figures, keep showing the last ones instead of blanking the diagram.
export function keepPreviousFlow(readings, previous = {}) {
  if (readings.hasFlowData) return { configured: true, ...readings };
  const kept = {};
  for (const key of FLOW_KEYS) kept[key] = previous[key] ?? readings[key];
  return { configured: true, ...readings, ...kept };
}

export const secretFields = provider => provider.fields.filter(field => field.secret);

const DEFAULT_MAX = { url: 300, text: 200, password: 500 };

// Applies user input to a provider's saved settings. A blank secret keeps the stored one;
// names listed in `clear` remove a stored secret. Returns { settings } or { error }.
export function applyFields(provider, current, values = {}, clear = []) {
  if (values === null || typeof values !== 'object' || !Array.isArray(clear)) return { error: 'Solar settings are invalid.' };
  const next = { ...current };

  for (const field of provider.fields) {
    const raw = values[field.name];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== 'string' && typeof raw !== 'number') return { error: `${field.label} is invalid.` };
    const text = String(raw).trim();
    const max = field.maxLength ?? DEFAULT_MAX[field.type] ?? 200;

    if (field.secret) {
      if (!text) continue; // blank keeps the stored secret
      if (text.length > max) return { error: `${field.label} is too long.` };
      next[field.name] = text;
      continue;
    }

    if (!text) {
      if (field.required) return { error: `${field.label} is required.` };
      next[field.name] = '';
      continue;
    }
    if (text.length > max) return { error: `${field.label} is too long.` };
    if (field.type === 'url') {
      let url;
      try { url = new URL(text); }
      catch { return { error: `${field.label} must be a valid URL.` }; }
      if (!/^https?:$/.test(url.protocol)) return { error: `${field.label} must start with http:// or https://.` };
      next[field.name] = url.toString().replace(/\/+$/, '');
    } else {
      if (field.pattern && !field.pattern.test(text)) return { error: field.patternMessage || `${field.label} is not valid.` };
      next[field.name] = text;
    }
  }

  for (const name of clear) {
    if (secretFields(provider).some(field => field.name === name)) next[name] = '';
  }
  return { settings: next };
}

// The part of a provider's settings the browser may see.
export function describeSettings(provider, settings) {
  const values = provider.publicValues
    ? provider.publicValues(settings)
    : Object.fromEntries(provider.fields.filter(field => !field.secret).map(field => [field.name, settings[field.name] ?? '']));
  return {
    configured: provider.isConfigured(settings),
    values,
    secretsSet: secretFields(provider).filter(field => settings[field.name]).map(field => field.name)
  };
}

// The schema sent to the browser so the settings screen can draw each provider's form.
export const publicSchema = provider => {
  const defaults = provider.defaults();
  return {
    id: provider.id,
    label: provider.label,
    fields: provider.fields.map(({ name, label, type, secret = false, required = false, placeholder = '', help = '' }) => ({ name, label, type, secret, required, placeholder, help })),
    defaults: Object.fromEntries(provider.fields.filter(field => !field.secret).map(field => [field.name, defaults[field.name] ?? '']))
  };
};

// ---- Building readings ------------------------------------------------------------------

const MIN_FLOW_W = 20; // below this a path is treated as idle, the same threshold the dashboard uses
const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : null);

// Turns a provider's raw figures into the readings shape. Anything the provider could not supply stays null, and
// hasFlowData is only true when at least one live power figure is known (so keepPreviousFlow can do its job).
//   pv, grid (import), battery (discharging), batteryCharge (charging), consumption: watts
export function buildReadings(input) {
  const pv = num(input.pv);
  const grid = num(input.grid);
  const battery = num(input.battery);
  const batteryCharge = num(input.batteryCharge);
  const consumption = num(input.consumption);
  const on = value => value !== null && value >= MIN_FLOW_W;
  const flowPv = on(pv);
  const flowGrid = on(grid);
  const flowBatteryOut = on(battery);
  const flowBatteryIn = on(batteryCharge);
  const flowLoad = on(consumption);

  const candidates = [['PV', pv], ['BATTERY', battery], ['GRID', grid]].filter(([, value]) => value !== null && Math.abs(value) >= MIN_FLOW_W);
  const activeSource = candidates.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? 'STANDBY';

  const feeding = [];
  if (flowPv) feeding.push(`PV ${Math.round(pv)}W`);
  if (flowGrid) feeding.push(`Grid ${Math.round(grid)}W`);
  if (flowBatteryOut) feeding.push(`Battery ${Math.round(battery)}W`);
  const sinking = [];
  if (flowLoad) sinking.push(`Load ${Math.round(consumption)}W`);
  if (flowBatteryIn) sinking.push(`Charge ${Math.round(batteryCharge)}W`);

  return {
    plant: input.plant ?? 'Solar system',
    power: num(input.power),
    today: num(input.today),
    total: num(input.total),
    status: input.status ?? 'Connected',
    updatedAt: input.updatedAt ?? null,
    pv,
    grid,
    battery,
    batteryCharge,
    batteryPercent: num(input.batteryPercent),
    batteryVoltage: num(input.batteryVoltage),
    consumption,
    activeSource,
    flowSummary: [feeding.length ? feeding.join(' + ') : 'No source', sinking.length ? sinking.join(' · ') : 'Idle'].join(' → '),
    flowPv,
    flowGrid,
    flowBatteryOut,
    flowBatteryIn,
    flowLoad,
    hasFlowData: [pv, consumption, battery, batteryCharge, grid].some(value => value !== null)
  };
}

const watts = value => (value === null || value === undefined ? 'not available' : `${Math.round(value)} W`);

// What "Check connection" shows for a provider that has no inspect() of its own.
export function describeReadings(readings) {
  return {
    lines: [
      `Connected to ${readings.plant}.`,
      `Solar: ${watts(readings.pv)}`,
      `Grid import: ${watts(readings.grid)}`,
      `House load: ${watts(readings.consumption)}`,
      `Battery: ${readings.batteryPercent === null ? 'not available' : `${readings.batteryPercent}%`}, charging ${watts(readings.batteryCharge)}, discharging ${watts(readings.battery)}`
    ]
  };
}
