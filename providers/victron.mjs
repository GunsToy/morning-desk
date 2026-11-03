// Victron VRM adapter: reads a GX device's live system values from the VRM cloud.
// Sign-in is a personal access token (VRM: Preferences → Integrations → Access tokens), sent as "X-Authorization: Token …".
// The values are the GX device's own system summary (com.victronenergy.system), found in VRM's diagnostics by D-Bus path:
// the same figures the GX device shows on its overview screen.
import { USER_AGENT, FETCH_TIMEOUT_MS, summariseFlow, numberOrNull, splitBatteryPower } from './common.mjs';

const API = 'https://vrmapi.victronenergy.com/v2';

async function vrm(path, token) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'X-Authorization': `Token ${token}`, Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  const body = await response.json().catch(() => null);
  if (response.status === 401 || response.status === 403) {
    throw new Error('VRM rejected the access token. Create a new one in VRM under Preferences → Integrations → Access tokens.');
  }
  if (!response.ok || !body || body.success === false) {
    throw new Error(typeof body?.errors === 'string' ? body.errors : `VRM returned ${response.status}.`);
  }
  return body;
}

// The installation to show: the one whose ID was entered, or the first one on the account. The ID used in later
// requests always comes from VRM's own list, never from what was typed.
async function pickInstallation(token, wantedId) {
  const me = await vrm('/users/me', token);
  const userId = Number(me.user?.id);
  if (!Number.isInteger(userId)) throw new Error('VRM did not say which account this token belongs to.');
  const { records = [] } = await vrm(`/users/${userId}/installations`, token);
  const wanted = String(wantedId ?? '').trim();
  const site = wanted ? records.find(item => String(item.idSite) === wanted) : records[0];
  if (!site) {
    throw new Error(wanted
      ? `This access token cannot see VRM installation ${wanted}. Check the ID, or leave it blank to use your first installation.`
      : 'This access token has no VRM installations.');
  }
  if (!Number.isInteger(Number(site.idSite))) throw new Error('VRM returned an installation without an ID.');
  return site;
}

// Turns VRM diagnostics records into the readings every provider returns.
export function readingsFromDiagnostics(records, siteName) {
  // Prefer the system summary's record for a path; fall back to any device reporting it.
  const at = path => {
    const record = records.find(item => item.dbusPath === path && item.dbusServiceType === 'system')
      ?? records.find(item => item.dbusPath === path);
    return numberOrNull(record?.rawValue);
  };
  const total = values => {
    const known = values.filter(value => value !== null);
    return known.length ? known.reduce((sum, value) => sum + value, 0) : null;
  };
  const phases = base => total(['L1', 'L2', 'L3'].map(phase => at(`${base}/${phase}/Power`)));

  // Solar can be DC-coupled (MPPT chargers) and AC-coupled (a PV inverter on the input or output side).
  const pv = total([at('/Dc/Pv/Power'), phases('/Ac/PvOnOutput'), phases('/Ac/PvOnGrid'), phases('/Ac/PvOnGenset')]);
  const gridNet = phases('/Ac/Grid'); // positive = importing, negative = exporting
  const grid = gridNet === null ? null : Math.max(0, gridNet);
  const consumption = phases('/Ac/Consumption');
  // Venus counts battery power positive while charging.
  const { battery, batteryCharge } = splitBatteryPower(at('/Dc/Battery/Power'), false);

  return {
    plant: siteName || 'Victron system',
    status: null,
    updatedAt: null,
    power: pv,
    today: null,
    total: null,
    pv,
    grid,
    gridVoltage: null,
    battery,
    batteryCharge,
    batteryPercent: at('/Dc/Battery/Soc'),
    batteryVoltage: at('/Dc/Battery/Voltage'),
    consumption,
    ...summariseFlow({ pv, grid, battery, batteryCharge, consumption })
  };
}

export default {
  id: 'victron',
  label: 'Victron VRM',
  fields: [
    { name: 'accessToken', label: 'VRM access token', type: 'password', secret: true, placeholder: 'VRM: Preferences → Integrations → Access tokens' },
    { name: 'installationId', label: 'Installation ID', type: 'text', placeholder: 'Leave blank to use your first installation', maxLength: 20 }
  ],

  defaults: () => ({ accessToken: '', installationId: '' }),

  clean: (raw = {}) => ({
    accessToken: String(raw.accessToken ?? ''),
    installationId: String(raw.installationId ?? '')
  }),

  isConfigured: settings => Boolean(settings.accessToken),

  async fetchReadings({ accessToken, installationId }) {
    const site = await pickInstallation(accessToken, installationId);
    const { records = [] } = await vrm(`/installations/${Number(site.idSite)}/diagnostics?count=1000`, accessToken);
    if (!records.length) throw new Error('VRM has no live data for this installation yet. Check that the GX device is online.');
    return readingsFromDiagnostics(records, site.name);
  },

  explainError: error => error.name === 'TimeoutError'
    ? 'VRM did not answer within 15 seconds. The widget will try again in 15 minutes.'
    : error.message
};
