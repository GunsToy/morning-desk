import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'config.json');
const defaultConfig = {
  location: { name: 'Erasmuskloof', latitude: -25.81566858703483, longitude: 28.269596944734296, timezone: 'Africa/Johannesburg' },
  growatt: { server: 'https://openapi.growatt.com/v1', apiToken: '' },
  news: ['daily-maverick', 'bbc']
};
let solarCache = { until: 0, value: null };

const NEWS_FEEDS = [
  { id: 'daily-maverick', name: 'Daily Maverick', region: 'South Africa', url: 'https://www.dailymaverick.co.za/dmrss/', site: 'https://www.dailymaverick.co.za' },
  { id: 'mail-guardian', name: 'Mail & Guardian', region: 'South Africa', url: 'https://mg.co.za/rss', site: 'https://mg.co.za' },
  { id: 'news24', name: 'News24', region: 'South Africa', url: 'https://feeds.capi24.com/v1/Search/articles/news24/TopStories/rss', site: 'https://www.news24.com' },
  { id: 'iol', name: 'IOL', region: 'South Africa', url: 'https://rss.iol.io/iol/news', site: 'https://www.iol.co.za' },
  { id: 'bbc', name: 'BBC News', region: 'World', url: 'https://feeds.bbci.co.uk/news/rss.xml', site: 'https://www.bbc.com/news' },
  { id: 'bbc-world', name: 'BBC World', region: 'World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', site: 'https://www.bbc.com/news/world' },
  { id: 'guardian', name: 'The Guardian', region: 'World', url: 'https://www.theguardian.com/world/rss', site: 'https://www.theguardian.com' },
  { id: 'nyt', name: 'New York Times', region: 'World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', site: 'https://www.nytimes.com' },
  { id: 'npr', name: 'NPR', region: 'World', url: 'https://feeds.npr.org/1001/rss.xml', site: 'https://www.npr.org' },
  { id: 'aljazeera', name: 'Al Jazeera', region: 'World', url: 'https://www.aljazeera.com/xml/rss/all.xml', site: 'https://www.aljazeera.com' },
  { id: 'sky', name: 'Sky News', region: 'World', url: 'https://feeds.skynews.com/feeds/rss/home.xml', site: 'https://news.sky.com' },
  { id: 'nbc', name: 'NBC News', region: 'World', url: 'https://feeds.nbcnews.com/feeds/topstories', site: 'https://www.nbcnews.com' },
  { id: 'pbs', name: 'PBS NewsHour', region: 'World', url: 'https://www.pbs.org/newshour/feeds/rss/headlines', site: 'https://www.pbs.org/newshour' },
  { id: 'reuters', name: 'Reuters', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:reuters.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://www.reuters.com' },
  { id: 'cnn', name: 'CNN', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:cnn.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://www.cnn.com' },
  { id: 'ap', name: 'Associated Press', region: 'World', url: 'https://news.google.com/rss/search?q=when:24h+site:apnews.com&hl=en-ZA&gl=ZA&ceid=ZA:en', site: 'https://apnews.com' }
];

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
        apiToken: saved.growatt?.apiToken ?? saved.growatt?.token ?? ''
      },
      news: Array.isArray(saved.news) && saved.news.length ? saved.news : defaultConfig.news
    };
  } catch { return defaultConfig; }
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

const app = express();
app.use(express.json());
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'), err => { if (err) res.status(500).send('Morning Desk index missing'); });
});
app.get('/api/feeds', (_req, res) => {
  res.json({ feeds: NEWS_FEEDS.map(({ id, name, region, site }) => ({ id, name, region, site })) });
});
app.get('/api/config', async (_req, res) => {
  const config = await getConfig();
  res.json({ location: config.location, growattConfigured: Boolean(config.growatt?.apiToken), growattServer: config.growatt.server, news: config.news });
});
app.put('/api/config', async (req, res) => {
  const previous = await getConfig();
  const next = {
    location: { ...previous.location, ...req.body.location },
    growatt: {
      ...previous.growatt,
      ...(req.body.growatt?.server ? { server: req.body.growatt.server } : {}),
      ...(req.body.growatt?.apiToken ? { apiToken: req.body.growatt.apiToken.trim() } : {})
    },
    news: Array.isArray(req.body.news) ? req.body.news.filter(id => NEWS_FEEDS.some(feed => feed.id === id)) : previous.news
  };
  await fs.writeFile(configPath, JSON.stringify(next, null, 2));
  res.json({ ok: true });
});
app.get('/api/news', async (req, res) => {
  try {
    const feed = NEWS_FEEDS.find(item => item.id === req.query.id);
    if (!feed) return res.status(404).json({ error: 'Unknown news channel' });
    const xml = await getText(feed.url);
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 7).map(match => ({
      title: tag(match[1], 'title'),
      link: tag(match[1], 'link') || tag(match[1], 'guid'),
      published: tag(match[1], 'pubDate')
    })).filter(item => item.title);
    res.json({ id: feed.id, name: feed.name, site: feed.site, items });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
app.get('/api/weather', async (_req, res) => {
  try {
    const { location } = await getConfig();
    const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, timezone: location.timezone, current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset', forecast_days: '5' });
    const data = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`).then(r => r.json());
    res.json({ location: location.name, ...data });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
app.get('/api/solar', async (_req, res) => res.json({ configured: false }));
app.get('/api/sky', async (_req, res) => {
  try {
    const html = await getText('https://www.youtube.com/@SkyNews/live');
    const match = html.match(/"videoId":"([^"\\]+)"/);
    if (!match) throw new Error('Sky News is not live');
    res.json({ videoId: match[1] });
  } catch (error) { res.status(502).json({ error: error.message }); }
});
const PORT = Number(process.env.PORT) || 4123;
app.listen(PORT, '0.0.0.0', () => console.log(`Morning Desk on ${PORT}`));
