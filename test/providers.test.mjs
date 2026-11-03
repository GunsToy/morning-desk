// Victron VRM and Sunsynk adapters, checked against recorded-shape API answers (no network).
// Run with: npm test
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as providers from '../providers/index.mjs';
import victron, { readingsFromDiagnostics } from '../providers/victron.mjs';
import sunsynk, { readingsFrom } from '../providers/sunsynk.mjs';
import { applyFields, describeSettings } from '../providers/common.mjs';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });
const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });

test('all three providers are registered and their secrets stay write-only', () => {
  assert.deepEqual(providers.list().map(item => item.id), ['growatt', 'sunsynk', 'victron']);
  const shown = describeSettings(sunsynk, { server: 'https://api.sunsynk.net', username: 'me@example.com', password: 'hunter22' });
  assert.deepEqual(shown.values, { server: 'https://api.sunsynk.net', username: 'me@example.com' });
  assert.deepEqual(shown.secretsSet, ['password']);
  assert.match(applyFields(sunsynk, sunsynk.defaults(), { server: 'https://evil.example' }).error, /pick one from the list/);
});

// ---- Victron ----
const record = (dbusPath, rawValue, dbusServiceType = 'system') => ({ dbusPath, rawValue, dbusServiceType });

test('victron: phases are summed, battery charging is split out, and solar adds DC and AC-coupled PV', () => {
  const data = readingsFromDiagnostics([
    record('/Dc/Pv/Power', 1200),
    record('/Ac/PvOnGrid/L1/Power', 300),
    record('/Ac/Grid/L1/Power', 150), record('/Ac/Grid/L2/Power', 50),
    record('/Ac/Consumption/L1/Power', 900),
    record('/Dc/Battery/Power', 750), // Venus: positive = charging
    record('/Dc/Battery/Soc', 81.5),
    record('/Dc/Battery/Voltage', 52.9),
    record('/Dc/Battery/Soc', 12, 'battery') // another device's copy is ignored in favour of the system summary
  ], 'Cabin');
  assert.equal(data.plant, 'Cabin');
  assert.equal(data.pv, 1500);
  assert.equal(data.grid, 200);
  assert.equal(data.consumption, 900);
  assert.equal(data.batteryCharge, 750);
  assert.equal(data.battery, 0);
  assert.equal(data.batteryPercent, 81.5);
  assert.equal(data.batteryVoltage, 52.9);
  assert.equal(data.flowBatteryIn, true);
  assert.equal(data.activeSource, 'PV');
});

test('victron: exporting shows no grid import, and a discharging battery feeds the load', () => {
  const data = readingsFromDiagnostics([record('/Ac/Grid/L1/Power', -400), record('/Dc/Battery/Power', -600)]);
  assert.equal(data.grid, 0);
  assert.equal(data.battery, 600);
  assert.equal(data.batteryCharge, 0);
  assert.equal(data.flowBatteryOut, true);
  assert.equal(data.pv, null, 'no PV records means unknown, not zero');
});

test('victron: picks the installation by ID from VRM\'s own list and sends the token header', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), auth: options.headers['X-Authorization'] });
    const u = String(url);
    if (u.endsWith('/users/me')) return json({ success: true, user: { id: 7 } });
    if (u.endsWith('/users/7/installations')) return json({ success: true, records: [{ idSite: 1, name: 'Home' }, { idSite: 42, name: 'Farm' }] });
    if (u.includes('/installations/42/diagnostics')) return json({ success: true, records: [record('/Dc/Battery/Soc', 66)] });
    return json({ success: false }, 404);
  };
  const data = await victron.fetchReadings({ accessToken: 'tok', installationId: '42' });
  assert.equal(data.plant, 'Farm');
  assert.equal(data.batteryPercent, 66);
  assert.ok(calls.every(call => call.auth === 'Token tok'));
  await assert.rejects(victron.fetchReadings({ accessToken: 'tok', installationId: '../../users/me' }), /cannot see VRM installation/);
});

test('victron: a rejected token says how to make a new one', async () => {
  globalThis.fetch = async () => json({ success: false, errors: 'Invalid token' }, 401);
  await assert.rejects(victron.fetchReadings({ accessToken: 'bad', installationId: '' }), /Access tokens/);
});

// ---- Sunsynk ----
test('sunsynk: signs in with the RSA-encrypted password and MD5-signed nonce, then reads the first inverter', async () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 });
  const publicDer = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const md5 = text => crypto.createHash('md5').update(text).digest('hex');
  let login;
  const seen = [];
  globalThis.fetch = async (url, options) => {
    const u = new URL(String(url));
    seen.push(u.pathname);
    if (u.pathname === '/anonymous/publicKey') {
      const nonce = u.searchParams.get('nonce');
      assert.equal(u.searchParams.get('sign'), md5(`nonce=${nonce}&source=sunsynk` + 'POWER_VIEW'));
      return json({ code: 0, success: true, data: publicDer });
    }
    if (u.pathname === '/oauth/token/new') {
      login = JSON.parse(options.body);
      return json({ code: 0, success: true, data: { access_token: 'abc' } });
    }
    assert.equal(options.headers.Authorization, 'Bearer abc');
    if (u.pathname === '/api/v1/inverters') return json({ code: 0, data: { infos: [{ sn: 'SN1', plant: { name: 'Pretoria' } }] } });
    if (u.pathname.includes('/battery/')) return json({ code: 0, data: { power: -900, soc: 74, voltage: 53.1 } });
    if (u.pathname.includes('/grid/')) return json({ code: 0, data: { pac: 120, vip: [{ volt: 231 }] } });
    if (u.pathname.includes('/load/')) return json({ code: 0, data: { totalPower: 1400 } });
    if (u.pathname.endsWith('/realtime/input')) return json({ code: 0, data: { pac: 2200, etoday: 9.4, etotal: 5120 } });
    return json({ code: 1, msg: 'unexpected' });
  };

  const data = await sunsynk.fetchReadings({ server: 'https://api.sunsynk.net', username: 'me@example.com', password: 'hunter22' });

  // The password in the token request decrypts to the real one (PKCS#1 v1.5, unwrapped by hand: 00 02 <pad> 00 <message>).
  const block = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_NO_PADDING }, Buffer.from(login.password, 'base64'));
  assert.equal(block[0], 0); assert.equal(block[1], 2);
  assert.equal(block.subarray(block.indexOf(0, 2) + 1).toString('utf8'), 'hunter22');
  assert.equal(login.username, 'me@example.com');
  assert.equal(login.client_id, 'csp-web');
  assert.equal(login.sign, md5(`nonce=${login.nonce}&source=sunsynk${publicDer.slice(0, 10)}`));

  assert.equal(data.plant, 'Pretoria');
  assert.equal(data.pv, 2200);
  assert.equal(data.grid, 120);
  assert.equal(data.gridVoltage, 231);
  assert.equal(data.consumption, 1400);
  assert.equal(data.batteryCharge, 900, 'negative battery power is charging');
  assert.equal(data.battery, 0);
  assert.equal(data.batteryPercent, 74);
  assert.equal(data.today, 9.4);
  assert.ok(seen.includes('/api/v1/inverter/SN1/realtime/input'));
});

test('sunsynk: a refused sign-in shows Sunsynk\'s own message', async () => {
  globalThis.fetch = async url => String(url).includes('publicKey')
    ? json({ code: 102, success: false, msg: 'Incorrect username or password' })
    : json({ code: 0 });
  await assert.rejects(sunsynk.fetchReadings({ server: 'https://api.sunsynk.net', username: 'x', password: 'y' }), /Sunsynk: Incorrect username or password/);
});

test('sunsynk: exporting shows no grid import; missing figures stay unknown', () => {
  const data = readingsFrom({ sn: 'A' }, { grid: { pac: -500 }, battery: { power: 300 } });
  assert.equal(data.grid, 0);
  assert.equal(data.battery, 300);
  assert.equal(data.pv, null);
  assert.equal(data.gridVoltage, null);
  assert.equal(data.plant, 'Sunsynk system');
});
