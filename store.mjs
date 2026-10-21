import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const configPath = process.env.CONFIG_PATH || path.join(__dirname, 'config.json');

export const DEFAULT_SERVER = 'https://openapi.growatt.com/v1';
export const DEFAULT_NEWS = ['daily-maverick', 'bbc'];
export const DEFAULT_LOCATION = { name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' };

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function blankProfile() {
  return {
    id: '',
    name: '',
    location: { ...DEFAULT_LOCATION },
    growatt: { server: DEFAULT_SERVER, apiToken: '' },
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

function cleanProfile(raw = {}) {
  const base = blankProfile();
  const growatt = raw.growatt ?? {};
  return {
    id: String(raw.id || ''),
    name: String(raw.name || 'Home'),
    location: { ...base.location, ...raw.location },
    growatt: {
      // Older versions stored the same values under different names; keep reading them.
      server: growatt.server ?? growatt.apiBase ?? base.growatt.server,
      apiToken: growatt.apiToken ?? growatt.token ?? growatt.thirdPartyKey ?? ''
    },
    news: Array.isArray(raw.news) ? raw.news.map(String) : [...base.news]
  };
}

// Turns whatever is on disk into the current shape:
// { version, admin: {salt, hash} | null, defaultProfile, profiles: [...] }
function upgrade(saved) {
  const config = { version: 2, admin: null, defaultProfile: '', profiles: [] };
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

const toNumber = value => typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);

// Applies the fields present in `input` to `profile`. Returns an error message, or null when it is fine.
// A blank Growatt token keeps the stored one; send growatt.clearToken = true to remove it.
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

  if (input.growatt !== undefined) {
    const growatt = input.growatt ?? {};
    const next = { ...profile.growatt };
    if (growatt.server !== undefined && String(growatt.server).trim() !== '') {
      let url;
      try { url = new URL(String(growatt.server).trim()); }
      catch { return 'The Growatt address must be a valid URL.'; }
      if (!/^https?:$/.test(url.protocol)) return 'The Growatt address must start with http:// or https://.';
      next.server = url.toString().replace(/\/+$/, '');
    }
    if (growatt.clearToken === true) next.apiToken = '';
    else if (typeof growatt.apiToken === 'string' && growatt.apiToken.trim()) {
      if (growatt.apiToken.trim().length > 500) return 'The API token is too long.';
      next.apiToken = growatt.apiToken.trim();
    }
    profile.growatt = next;
  }

  if (input.news !== undefined) {
    if (!Array.isArray(input.news)) return 'News must be a list of channel ids.';
    profile.news = [...new Set(input.news.map(String))].filter(id => validNews.has(id));
  }

  return null;
}
