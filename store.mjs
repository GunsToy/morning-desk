import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as providers from './providers/index.mjs';
import { applyFields } from './providers/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const configPath = process.env.CONFIG_PATH || path.join(__dirname, 'config.json');

export const DEFAULT_NEWS = ['daily-maverick', 'bbc'];
export const DEFAULT_LOCATION = { name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' };

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function blankProfile() {
  return {
    id: '',
    name: '',
    location: { ...DEFAULT_LOCATION },
    solar: { provider: providers.DEFAULT_PROVIDER, settings: { [providers.DEFAULT_PROVIDER]: providers.get(providers.DEFAULT_PROVIDER).defaults() } },
    batteryKwh: null, // usable battery capacity; null hides the runtime estimate
    news: [...DEFAULT_NEWS]
  };
}

export function uniqueId(taken, name) {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 26).replace(/-+$/, '') || 'profile';
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  return id;
}

// Solar settings are kept per provider, so switching provider in Settings does not lose the other one's credentials.
function cleanSolar(raw) {
  const incoming = raw.solar && typeof raw.solar === 'object' ? raw.solar : {};
  const settings = {};
  for (const [id, value] of Object.entries(incoming.settings ?? {})) {
    // A provider this version does not know about is kept untouched rather than dropped.
    settings[id] = providers.has(id) ? providers.get(id).clean(value) : value;
  }
  // Profiles saved before solar providers existed kept the Growatt details in a top-level "growatt" block.
  if (raw.growatt && !settings.growatt) settings.growatt = providers.get('growatt').clean(raw.growatt);
  const provider = providers.has(incoming.provider) ? incoming.provider : providers.DEFAULT_PROVIDER;
  return { provider, settings };
}

function cleanProfile(raw = {}) {
  const base = blankProfile();
  return {
    id: String(raw.id || ''),
    name: String(raw.name || 'Home'),
    location: { ...base.location, ...raw.location },
    solar: cleanSolar(raw),
    batteryKwh: Number.isFinite(raw.batteryKwh) && raw.batteryKwh > 0 ? raw.batteryKwh : null,
    news: Array.isArray(raw.news) ? raw.news.map(String) : [...base.news]
  };
}

// Turns whatever is on disk into the current shape:
// { version, admin: {salt, hash} | null, defaultProfile, profiles: [...] }
function upgrade(saved) {
  const config = { version: 3, admin: null, defaultProfile: '', profiles: [] };
  if (saved && typeof saved === 'object') {
    if (saved.admin?.salt && saved.admin?.hash) config.admin = { salt: String(saved.admin.salt), hash: String(saved.admin.hash) };
    if (Array.isArray(saved.profiles) && saved.profiles.length) {
      const seen = new Set();
      for (const raw of saved.profiles) {
        const profile = cleanProfile(raw);
        if (!ID_PATTERN.test(profile.id) || seen.has(profile.id)) profile.id = uniqueId(seen, profile.name);
        seen.add(profile.id);
        config.profiles.push(profile);
      }
      config.defaultProfile = String(saved.defaultProfile || '');
    } else {
      // Single-profile config from before profiles existed: it becomes the first profile.
      const profile = cleanProfile({
        ...saved,
        name: saved.location?.name || 'Home',
        news: saved.news?.length ? saved.news : undefined
      });
      profile.id = 'home';
      config.profiles.push(profile);
    }
  }
  if (!config.profiles.length) {
    const profile = cleanProfile({ name: 'Home' });
    profile.id = 'home';
    config.profiles.push(profile);
  }
  if (!config.profiles.some(profile => profile.id === config.defaultProfile)) config.defaultProfile = config.profiles[0].id;
  return config;
}

async function load(strict) {
  let text;
  try { text = await fs.readFile(configPath, 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT' || !strict) return upgrade(null);
    throw error;
  }
  if (!text.trim()) return upgrade(null);
  try { return upgrade(JSON.parse(text)); }
  catch {
    // Never overwrite a file we could not parse: it may hold a token that is only damaged, not gone.
    if (strict) throw new Error('config.json is not valid JSON, so it was left untouched.');
    return upgrade(null);
  }
}

export const read = () => load(false);

async function save(config) {
  // Written in place (not renamed over) because Docker bind-mounts this single file.
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

let queue = Promise.resolve();

// Read-modify-write, one at a time. The mutator may throw to abort without saving.
export function update(mutator) {
  const run = queue.then(async () => {
    const config = await load(true);
    const result = await mutator(config);
    await save(config);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

function legacyGrowatt(growatt) {
  if (growatt === undefined) return undefined;
  if (growatt === null || typeof growatt !== 'object') return null;
  const values = {};
  if (typeof growatt.server === 'string' && growatt.server.trim()) values.server = growatt.server;
  if (growatt.apiToken !== undefined) values.apiToken = growatt.apiToken;
  return { provider: 'growatt', values, clearSecrets: growatt.clearToken === true ? ['apiToken'] : [] };
}

// input: { provider?, values?: { field: value }, clearSecrets?: [field] }. Returns an error message, or null.
function applySolarInput(profile, input) {
  if (input === null || typeof input !== 'object') return 'Solar settings are invalid.';
  const id = input.provider ?? profile.solar.provider;
  const provider = providers.get(id);
  if (!provider) return 'Unknown solar provider.';
  const current = profile.solar.settings[id] ?? provider.defaults();
  const result = applyFields(provider, current, input.values ?? {}, input.clearSecrets ?? []);
  if (result.error) return result.error;
  profile.solar = { provider: id, settings: { ...profile.solar.settings, [id]: result.settings } };
  return null;
}

const toNumber = value => typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);

// Applies the fields present in `input` to `profile`. Returns an error message, or null when it is fine.
// Solar settings go through the chosen provider's field list: a blank secret keeps the stored one,
// and clearSecrets removes one.
export function applyProfileInput(profile, input = {}, validNews = new Set()) {
  if (input === null || typeof input !== 'object') return 'Invalid request body.';

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name || name.length > 40) return 'Profile name must be 1 to 40 characters.';
    profile.name = name;
  }

  if (input.location !== undefined) {
    const loc = input.location ?? {};
    const next = { ...profile.location };
    if (loc.name !== undefined) {
      const name = String(loc.name).trim();
      if (!name || name.length > 60) return 'Location name must be 1 to 60 characters.';
      next.name = name;
    }
    if (loc.latitude !== undefined) {
      const value = toNumber(loc.latitude);
      if (!Number.isFinite(value) || value < -90 || value > 90) return 'Latitude must be a number between -90 and 90.';
      next.latitude = value;
    }
    if (loc.longitude !== undefined) {
      const value = toNumber(loc.longitude);
      if (!Number.isFinite(value) || value < -180 || value > 180) return 'Longitude must be a number between -180 and 180.';
      next.longitude = value;
    }
    if (loc.timezone !== undefined) {
      const timezone = String(loc.timezone).trim();
      try { new Intl.DateTimeFormat('en', { timeZone: timezone }); }
      catch { return 'Unknown timezone. Use a name like Africa/Johannesburg.'; }
      next.timezone = timezone;
    }
    profile.location = next;
  }

  // The older request shape { growatt: { server, apiToken, clearToken } } is still accepted.
  const solarInput = input.solar !== undefined ? input.solar : legacyGrowatt(input.growatt);
  if (solarInput !== undefined) {
    const problem = applySolarInput(profile, solarInput);
    if (problem) return problem;
  }

  if (input.batteryKwh !== undefined) {
    if (input.batteryKwh === null || String(input.batteryKwh).trim() === '') {
      profile.batteryKwh = null;
    } else {
      const value = toNumber(input.batteryKwh);
      if (!Number.isFinite(value) || value <= 0 || value > 1000) return 'Battery capacity must be a number of kWh above 0 and up to 1000, or blank.';
      profile.batteryKwh = value;
    }
  }

  if (input.news !== undefined) {
    if (!Array.isArray(input.news)) return 'News must be a list of channel ids.';
    profile.news = [...new Set(input.news.map(String))].filter(id => validNews.has(id));
  }

  return null;
}
