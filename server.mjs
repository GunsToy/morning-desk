import express from 'express';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from './store.mjs';
import * as auth from './auth.mjs';
import * as providers from './providers/index.mjs';
import { describeSettings, keepPreviousFlow, publicSchema } from './providers/common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// One solar cache per profile, so profiles on different solar accounts never share readings.
const solarCaches = new Map();
const SOLAR_TTL = 15 * 60 * 1000;

async function getText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'MorningDesk/1.0 (personal dashboard)' } });
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response.text();
}

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

// Feed text comes back as plain text: tags are stripped first, then entities are decoded once.
// The browser escapes it again before display, so nothing in a feed can become markup.
function decode(value = '') {
  return decodeEntities(value.replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1').replace(/<[^>]+>/g, '')).trim();
}

function tag(block, name) {
  const result = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return result ? decode(result[1]) : '';
}

const app = express();
app.disable('x-powered-by');
// Trust X-Forwarded-* only from a proxy on this machine, so req.secure and req.ip are correct behind nginx.
// Trusting every private address would let any device on the LAN fake its address and dodge the login lockout.
// nginx on another host: set TRUST_PROXY to its address.
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      'font-src https://fonts.gstatic.com',
      "img-src 'self' data:",
      'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  });
  next();
});

app.use(express.json({ limit: '32kb' }));

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // Belt and braces on top of the SameSite=Strict cookie: refuse writes that come from another site.
  const origin = req.get('origin');
  if (origin) {
    let host = null;
    try { host = new URL(origin).host; } catch { /* treated as a mismatch below */ }
    const allowed = [req.get('host'), req.get('x-forwarded-host')?.split(',')[0].trim()].filter(Boolean);
    if (!allowed.includes(host)) return res.status(403).json({ error: 'Cross-origin request blocked.' });
  }
  next();
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Explicit root so a missing index never returns bare "Cannot GET /"
app.get('/', (_req, res) => {
  const index = path.join(publicDir, 'index.html');
  res.sendFile(index, err => {
    if (err) res.status(500).send(`Morning Desk index missing at ${index}`);
  });
});

const NEWS_FEEDS = [
  // South Africa
  { id: 'daily-maverick', name: 'Daily Maverick', region: 'South Africa', url: 'https://www.dailymaverick.co.za/dmrss/', site: 'https://www.dailymaverick.co.za' },
  { id: 'mail-guardian', name: 'Mail & Guardian', region: 'South Africa', url: 'https://mg.co.za/rss', site: 'https://mg.co.za' },
  { id: 'news24', name: 'News24', region: 'South Africa', url: 'https://news.google.com/rss/search?q=when:24h+site:news24.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://www.news24.com' },
  { id: 'iol', name: 'IOL', region: 'South Africa', url: 'https://iol.co.za/rss/', site: 'https://iol.co.za' },
  { id: 'timeslive', name: 'TimesLIVE', region: 'South Africa', url: 'https://www.timeslive.co.za/arc/outboundfeeds/rss/', site: 'https://www.timeslive.co.za' },
  { id: 'moneyweb', name: 'Moneyweb', region: 'South Africa', url: 'https://www.moneyweb.co.za/feed/', site: 'https://www.moneyweb.co.za' },
  { id: 'techcentral', name: 'TechCentral', region: 'South Africa', url: 'https://techcentral.co.za/feed/', site: 'https://techcentral.co.za' },
  { id: 'citizen', name: 'The Citizen', region: 'South Africa', url: 'https://www.citizen.co.za/feed/', site: 'https://www.citizen.co.za' },
  { id: 'ewn', name: 'Eyewitness News', region: 'South Africa', url: 'https://news.google.com/rss/search?q=when:24h+site:ewn.co.za&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://ewn.co.za' },
  // Id kept from when the site was BusinessLIVE, so saved profiles keep their choice.
  { id: 'businesslive', name: 'Business Day', region: 'South Africa', url: 'https://www.businessday.co.za/arc/outboundfeeds/rss/', site: 'https://www.businessday.co.za' },

  // World
  { id: 'bbc', name: 'BBC News', region: 'World', url: 'https://feeds.bbci.co.uk/news/rss.xml', site: 'https://www.bbc.com/news' },
  { id: 'bbc-world', name: 'BBC World', region: 'World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', site: 'https://www.bbc.com/news/world' },
  { id: 'bbc-africa', name: 'BBC Africa', region: 'World', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', site: 'https://www.bbc.com/news/world/africa' },
  { id: 'guardian', name: 'The Guardian', region: 'World', url: 'https://www.theguardian.com/world/rss', site: 'https://www.theguardian.com' },
  { id: 'nyt', name: 'New York Times', region: 'World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', site: 'https://www.nytimes.com' },
  { id: 'nyt-world', name: 'NYT World', region: 'World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', site: 'https://www.nytimes.com/section/world' },
  { id: 'npr', name: 'NPR', region: 'World', url: 'https://feeds.npr.org/1001/rss.xml', site: 'https://www.npr.org' },
  { id: 'aljazeera', name: 'Al Jazeera', region: 'World', url: 'https://www.aljazeera.com/xml/rss/all.xml', site: 'https://www.aljazeera.com' },
  { id: 'sky', name: 'Sky News', region: 'World', url: 'https://feeds.skynews.com/feeds/rss/home.xml', site: 'https://news.sky.com' },
  { id: 'nbc', name: 'NBC News', region: 'World', url: 'https://feeds.nbcnews.com/feeds/topstories', site: 'https://www.nbcnews.com' },
  { id: 'pbs', name: 'PBS NewsHour', region: 'World', url: 'https://www.pbs.org/newshour/feeds/rss/headlines', site: 'https://www.pbs.org/newshour' },
  { id: 'washingtonpost', name: 'Washington Post', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:washingtonpost.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://www.washingtonpost.com' },
  { id: 'dw', name: 'Deutsche Welle', region: 'World', url: 'https://rss.dw.com/rdf/rss-en-all', site: 'https://www.dw.com' },
  { id: 'france24', name: 'France 24', region: 'World', url: 'https://www.france24.com/en/rss', site: 'https://www.france24.com' },
  { id: 'economist', name: 'The Economist', region: 'World', url: 'https://www.economist.com/the-world-this-week/rss.xml', site: 'https://www.economist.com' },
  { id: 'reuters', name: 'Reuters', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:reuters.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://www.reuters.com' },
  { id: 'cnn', name: 'CNN', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:cnn.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://www.cnn.com' },
  { id: 'ap', name: 'Associated Press', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:apnews.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://apnews.com' },

  // Tech
  { id: 'techcrunch', name: 'TechCrunch', region: 'Tech', url: 'https://techcrunch.com/feed/', site: 'https://techcrunch.com' },
  { id: 'theverge', name: 'The Verge', region: 'Tech', url: 'https://www.theverge.com/rss/index.xml', site: 'https://www.theverge.com' },
  { id: 'wired', name: 'Wired', region: 'Tech', url: 'https://www.wired.com/feed/rss', site: 'https://www.wired.com' },
  { id: 'arstechnica', name: 'Ars Technica', region: 'Tech', url: 'https://feeds.arstechnica.com/arstechnica/index', site: 'https://arstechnica.com' },
  { id: 'techpowerup', name: 'TechPowerUp', region: 'Tech', url: 'https://www.techpowerup.com/rss/news', site: 'https://www.techpowerup.com' },
  { id: 'pcgamer', name: 'PC Gamer', region: 'Tech', url: 'https://www.pcgamer.com/rss/', site: 'https://www.pcgamer.com' },
  { id: 'hackernews', name: 'Hacker News', region: 'Tech', url: 'https://news.ycombinator.com/rss', site: 'https://news.ycombinator.com' }
];
const NEWS_IDS = new Set(NEWS_FEEDS.map(feed => feed.id));

app.get('/api/feeds', (_req, res) => {
  res.json({ feeds: NEWS_FEEDS.map(({ id, name, region, site }) => ({ id, name, region, site })) });
});

// ---- Helpers ---------------------------------------------------------------------------
const httpError = (status, message) => Object.assign(new Error(message), { status });

const handle = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error(`${req.method} ${req.path} failed:`, error);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!auth.sessionFromReq(req)) return res.status(401).json({ error: 'Admin login required.' });
  next();
};

const setSessionCookie = (req, res, token) => res.cookie(auth.COOKIE_NAME, token, {
  httpOnly: true,
  sameSite: 'strict',
  secure: req.secure,
  maxAge: auth.SESSION_TTL,
  path: '/'
});

const passwordProblem = value =>
  typeof value !== 'string' || value.length < 8 || value.length > 200 ? 'Password must be 8 to 200 characters.' : null;

function throwIfLockedOut(req, res) {
  const retry = auth.loginRetryAfter(req.ip);
  if (!retry) return;
  res.set('Retry-After', String(retry));
  throw httpError(429, `Too many wrong passwords. Try again in ${Math.ceil(retry / 60)} minute(s).`);
}

// ---- Auth ------------------------------------------------------------------------------
app.get('/api/session', handle(async (req, res) => {
  const config = await store.read();
  res.json({
    authenticated: Boolean(auth.sessionFromReq(req)),
    setupRequired: !auth.effectiveRecord(config),
    passwordManagedByEnv: auth.envManaged()
  });
}));

// First run only: whoever opens the dashboard first picks the admin password.
// Set ADMIN_PASSWORD in the environment to skip this and avoid that window.
app.post('/api/auth/setup', handle(async (req, res) => {
  const problem = passwordProblem(req.body?.password);
  if (problem) throw httpError(400, problem);
  const record = await auth.hashPassword(req.body.password);
  await store.update(config => {
    if (auth.effectiveRecord(config)) throw httpError(409, 'An admin password is already set.');
    config.admin = record;
  });
  setSessionCookie(req, res, auth.createSession());
  res.json({ ok: true });
}));

app.post('/api/auth/login', handle(async (req, res) => {
  throwIfLockedOut(req, res);
  const record = auth.effectiveRecord(await store.read());
  if (!record) throw httpError(409, 'No admin password is set yet.');
  const ok = typeof req.body?.password === 'string' && await auth.verifyPassword(req.body.password, record);
  if (!ok) {
    auth.recordFailure(req.ip);
    throw httpError(401, 'Incorrect password.');
  }
  auth.clearFailures(req.ip);
  setSessionCookie(req, res, auth.createSession());
  res.json({ ok: true });
}));

app.post('/api/auth/logout', (req, res) => {
  const token = auth.sessionFromReq(req);
  if (token) auth.destroySession(token);
  res.clearCookie(auth.COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.post('/api/auth/password', requireAdmin, handle(async (req, res) => {
  if (auth.envManaged()) throw httpError(409, 'The admin password is set by the ADMIN_PASSWORD environment variable.');
  throwIfLockedOut(req, res);
  const record = auth.effectiveRecord(await store.read());
  const knowsCurrent = typeof req.body?.current === 'string' && await auth.verifyPassword(req.body.current, record);
  if (!knowsCurrent) {
    auth.recordFailure(req.ip);
    throw httpError(401, 'The current password is incorrect.');
  }
  const problem = passwordProblem(req.body.next);
  if (problem) throw httpError(400, problem);
  const next = await auth.hashPassword(req.body.next);
  await store.update(config => { config.admin = next; });
  auth.destroyAllSessions(); // signs out every other browser
  setSessionCookie(req, res, auth.createSession());
  res.json({ ok: true });
}));

// ---- Profiles --------------------------------------------------------------------------
function pickProfile(config, id) {
  return config.profiles.find(profile => profile.id === id)
    ?? config.profiles.find(profile => profile.id === config.defaultProfile)
    ?? config.profiles[0];
}

// What the browser may see. Secrets (API tokens, passwords) never leave the server: the browser is only told which are saved.
const publicProfile = (profile, config) => ({
  id: profile.id,
  name: profile.name,
  location: profile.location,
  solar: {
    provider: profile.solar.provider,
    byProvider: Object.fromEntries(providers.list().map(provider => [provider.id, describeSettings(provider, profile.solar.settings[provider.id] ?? provider.defaults())]))
  },
  news: profile.news,
  isDefault: profile.id === config.defaultProfile
});

app.get('/api/solar-providers', (_req, res) => {
  res.json({ defaultProvider: providers.DEFAULT_PROVIDER, providers: providers.list().map(publicSchema) });
});

app.get('/api/profiles', handle(async (_req, res) => {
  const config = await store.read();
  res.json({
    defaultProfile: config.defaultProfile,
    profiles: config.profiles.map(({ id, name, location }) => ({ id, name, locationName: location.name }))
  });
}));

app.get('/api/config', handle(async (req, res) => {
  const config = await store.read();
  res.json(publicProfile(pickProfile(config, req.query.profile), config));
}));

app.post('/api/profiles', requireAdmin, handle(async (req, res) => {
  const profile = await store.update(config => {
    if (!req.body?.name) throw httpError(400, 'Profile name is required.');
    const created = store.blankProfile();
    const problem = store.applyProfileInput(created, req.body, NEWS_IDS);
    if (problem) throw httpError(400, problem);
    created.id = store.uniqueId(new Set(config.profiles.map(item => item.id)), created.name);
    config.profiles.push(created);
    if (req.body.makeDefault === true) config.defaultProfile = created.id;
    return publicProfile(created, config);
  });
  res.status(201).json({ profile });
}));

app.put('/api/profiles/:id', requireAdmin, handle(async (req, res) => {
  const profile = await store.update(config => {
    const existing = config.profiles.find(item => item.id === req.params.id);
    if (!existing) throw httpError(404, 'Profile not found.');
    const problem = store.applyProfileInput(existing, req.body, NEWS_IDS);
    if (problem) throw httpError(400, problem);
    if (req.body?.makeDefault === true) config.defaultProfile = existing.id;
    return publicProfile(existing, config);
  });
  solarCaches.delete(req.params.id);
  res.json({ profile });
}));

app.delete('/api/profiles/:id', requireAdmin, handle(async (req, res) => {
  await store.update(config => {
    const index = config.profiles.findIndex(item => item.id === req.params.id);
    if (index === -1) throw httpError(404, 'Profile not found.');
    if (config.profiles.length === 1) throw httpError(400, 'You cannot delete the only profile.');
    config.profiles.splice(index, 1);
    if (config.defaultProfile === req.params.id) config.defaultProfile = config.profiles[0].id;
  });
  solarCaches.delete(req.params.id);
  res.json({ ok: true });
}));

app.get('/api/weather', async (req, res) => {
  try {
    const { location } = pickProfile(await store.read(), req.query.profile);
    const params = new URLSearchParams({
      latitude: location.latitude, longitude: location.longitude, timezone: location.timezone,
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset', forecast_days: '5'
    });
    const data = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`).then(r => r.json());
    res.json({ location: location.name, ...data });
  } catch (error) { res.status(502).json({ error: error.message }); }
});

app.get('/api/news', async (req, res) => {
  try {
    const feed = NEWS_FEEDS.find(item => item.id === req.query.id);
    if (!feed) return res.status(404).json({ error: 'Unknown news channel' });
    const xml = await getText(feed.url);
    // RSS 2.0 <item>, RSS 1.0 <item rdf:about="…"> and Atom <entry> (whose link is <link href="…"/>).
    const items = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].slice(0, 7).map(([, , block]) => ({
      title: tag(block, 'title'),
      link: tag(block, 'link') || decode(block.match(/<link\b[^>]*\bhref="([^"]*)"/i)?.[1] ?? '') || tag(block, 'guid'),
      published: tag(block, 'pubDate')
    })).filter(item => item.title);
    res.json({ id: feed.id, name: feed.name, site: feed.site, items });
  } catch (error) { res.status(502).json({ error: error.message }); }
});

app.get('/api/solar', async (req, res) => {
  const profile = pickProfile(await store.read(), req.query.profile);
  const cache = solarCaches.get(profile.id) ?? { until: 0, value: null };
  const provider = providers.get(profile.solar.provider);
  try {
    if (cache.until > Date.now()) return res.status(cache.value?.error ? 429 : 200).json(cache.value);
    const settings = profile.solar.settings[provider.id] ?? provider.defaults();
    if (!provider.isConfigured(settings)) return res.json({ configured: false });
    const readings = await provider.fetchReadings(settings);
    const value = keepPreviousFlow(readings, cache.value ?? {});
    solarCaches.set(profile.id, { until: Date.now() + Math.max(SOLAR_TTL, provider.minIntervalMs ?? 0), value });
    res.json(value);
  } catch (error) {
    const value = { configured: true, error: provider.explainError ? provider.explainError(error) : error.message };
    solarCaches.set(profile.id, { until: Date.now() + SOLAR_TTL, value });
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
const HOST = process.env.HOST || '0.0.0.0'; // reachable on the local network, not only localhost

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
  } catch {
    return [];
  }
}

app.listen(PORT, HOST, () => {
  console.log(`Morning Desk listening on http://${HOST}:${PORT}`);
  console.log(`  Public:  ${publicDir}`);
  console.log(`  Local:   http://127.0.0.1:${PORT}`);
  for (const ip of lanAddresses()) console.log(`  Network: http://${ip}:${PORT}`);
});
