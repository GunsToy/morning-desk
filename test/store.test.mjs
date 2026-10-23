// The config store decides whether a saved Growatt token survives an upgrade or a settings save.
// Run with: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'morning-desk-test-'));
const configPath = path.join(dir, 'config.json');
process.env.CONFIG_PATH = configPath; // store.mjs reads this when it is first imported
const store = await import('../store.mjs');

const writeConfig = value => fs.writeFile(configPath, typeof value === 'string' ? value : JSON.stringify(value));
const growattOf = profile => profile.solar.settings.growatt;

before(() => fs.rm(configPath, { force: true }));
after(() => fs.rm(dir, { recursive: true, force: true }));

test('a version-1 single-profile config keeps its Growatt token', async () => {
  await writeConfig({
    location: { name: 'Erasmuskloof', latitude: -25.8, longitude: 28.3, timezone: 'Africa/Johannesburg' },
    growatt: { server: 'https://openapi.growatt.com/v1', apiToken: 'v1-token' },
    news: ['bbc']
  });
  const config = await store.read();
  assert.equal(config.profiles.length, 1);
  assert.equal(config.profiles[0].id, 'home');
  assert.equal(config.profiles[0].name, 'Erasmuskloof');
  assert.equal(config.profiles[0].solar.provider, 'growatt');
  assert.equal(growattOf(config.profiles[0]).apiToken, 'v1-token');
  assert.deepEqual(config.profiles[0].news, ['bbc']);
});

test('older token names in a profile growatt block are carried over', async () => {
  await writeConfig({ profiles: [
    { id: 'a', name: 'A', growatt: { token: 'from-token' } },
    { id: 'b', name: 'B', growatt: { thirdPartyKey: 'from-key', apiBase: 'https://example.test/v1' } }
  ] });
  const [a, b] = (await store.read()).profiles;
  assert.equal(growattOf(a).apiToken, 'from-token');
  assert.equal(growattOf(b).apiToken, 'from-key');
  assert.equal(growattOf(b).server, 'https://example.test/v1');
});

test('a blank token in the settings form keeps the stored one; a new one replaces it', () => {
  const profile = store.blankProfile();
  growattOf(profile).apiToken = 'stored';

  assert.equal(store.applyProfileInput(profile, { solar: { values: { apiToken: '', server: 'https://openapi.growatt.com/v1' } } }), null);
  assert.equal(growattOf(profile).apiToken, 'stored');

  assert.equal(store.applyProfileInput(profile, { solar: { values: { apiToken: '  new-token  ' } } }), null);
  assert.equal(growattOf(profile).apiToken, 'new-token');
});

test('clearing the token removes it, in both the current and the older request shape', () => {
  const current = store.blankProfile();
  growattOf(current).apiToken = 'stored';
  assert.equal(store.applyProfileInput(current, { solar: { clearSecrets: ['apiToken'] } }), null);
  assert.equal(growattOf(current).apiToken, '');

  const legacy = store.blankProfile();
  growattOf(legacy).apiToken = 'stored';
  assert.equal(store.applyProfileInput(legacy, { growatt: { clearToken: true } }), null);
  assert.equal(growattOf(legacy).apiToken, '');
});

test('a save round-trips the token through config.json', async () => {
  await writeConfig({ profiles: [{ id: 'home', name: 'Home', solar: { provider: 'growatt', settings: { growatt: { apiToken: 'kept' } } } }] });
  await store.update(config => { config.profiles[0].name = 'Renamed'; });
  const saved = JSON.parse(await fs.readFile(configPath, 'utf8'));
  assert.equal(saved.version, 3);
  assert.equal(saved.profiles[0].name, 'Renamed');
  assert.equal(saved.profiles[0].solar.settings.growatt.apiToken, 'kept');
});

test('a damaged config.json is never overwritten by a save', async () => {
  const damaged = '{"profiles": [{"id": "home", "solar": {"settings": {"growatt": {"apiToken": "precious"';
  await writeConfig(damaged);
  await assert.rejects(store.update(config => { config.profiles[0].name = 'x'; }), /not valid JSON/);
  assert.equal(await fs.readFile(configPath, 'utf8'), damaged);
});

test('battery capacity: a number is kept, blank clears it, nonsense is rejected', () => {
  const profile = store.blankProfile();
  assert.equal(profile.batteryKwh, null);
  assert.equal(store.applyProfileInput(profile, { batteryKwh: '10.24' }), null);
  assert.equal(profile.batteryKwh, 10.24);
  assert.match(store.applyProfileInput(profile, { batteryKwh: '-5' }), /Battery capacity/);
  assert.match(store.applyProfileInput(profile, { batteryKwh: 'lots' }), /Battery capacity/);
  assert.equal(profile.batteryKwh, 10.24, 'a rejected value leaves the saved one alone');
  assert.equal(store.applyProfileInput(profile, { batteryKwh: '' }), null);
  assert.equal(profile.batteryKwh, null);
});

test('battery capacity survives a save, and configs without it still load', async () => {
  await writeConfig({ profiles: [{ id: 'home', name: 'Home' }] });
  assert.equal((await store.read()).profiles[0].batteryKwh, null);
  await store.update(config => { config.profiles[0].batteryKwh = 15; });
  assert.equal((await store.read()).profiles[0].batteryKwh, 15);
});
