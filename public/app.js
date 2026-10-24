const $ = selector => document.querySelector(selector);
const dialog = $('#settings-dialog');
const authDialog = $('#auth-dialog');
let config;

// Anything that came from a feed or the server goes through esc() / safeUrl() before it reaches innerHTML.
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const safeUrl = value => {
  try {
    const url = new URL(value, location.href);
    return /^https?:$/.test(url.protocol) ? url.href : '#';
  } catch { return '#'; }
};

const storage = {
  get: key => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage can be blocked */ } }
};

// Profile shown on this device. ?profile=<id> in the address wins, so a wall display can be bookmarked per profile.
let currentProfile = new URLSearchParams(location.search).get('profile') || storage.get('md.profile') || '';
let profileList = [];
let editingId = '';
let solarProviders = [];
let editingProfile = null; // what the open settings form was filled from
let session = { authenticated: false, setupRequired: false, passwordManagedByEnv: false };
const profileUrl = path => `${path}${path.includes('?') ? '&' : '?'}profile=${encodeURIComponent(currentProfile)}`;

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/login') session.authenticated = false;
    throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}

const codeMap = { 0:['☀','Clear sky'], 1:['🌤','Mainly clear'], 2:['⛅','Partly cloudy'], 3:['☁','Overcast'], 45:['🌫','Foggy'], 48:['🌫','Foggy'], 51:['🌦','Light drizzle'], 53:['🌦','Drizzle'], 55:['🌧','Heavy drizzle'], 61:['🌦','Light rain'], 63:['🌧','Rain'], 65:['🌧','Heavy rain'], 71:['🌨','Snow'], 80:['🌦','Showers'], 81:['🌧','Showers'], 82:['⛈','Heavy showers'], 95:['⛈','Thunderstorms'] };
const weatherState = code => codeMap[code] || ['☁','Cloudy'];
const unit = value => value == null || Number.isNaN(value) ? '—' : `${value >= 1000 ? (value / 1000).toFixed(2) : Math.round(value)} ${value >= 1000 ? 'kW' : 'W'}`;
const energy = value => value == null || Number.isNaN(value) ? '—' : `${Number(value).toFixed(1)} kWh`;

function updateClock() {
  const now = new Date();
  $('#weather-date').textContent = now.toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}
async function loadWeather() {
  const requested = currentProfile;
  const res = await fetch(profileUrl('/api/weather')); const data = await res.json(); if (!res.ok) throw Error(data.error);
  if (requested !== currentProfile) return; // the profile was switched while this was loading
  weatherUpdated = new Date();
  $('#weather-place').textContent = data.location; const [icon, condition] = weatherState(data.current.weather_code);
  $('#weather-icon').textContent = icon; $('#weather-temp').textContent = `${Math.round(data.current.temperature_2m)}°`; $('#weather-condition').textContent = condition; $('#weather-feels').textContent = `Feels like ${Math.round(data.current.apparent_temperature)}° · ${Math.round(data.current.wind_speed_10m)} km/h`;
  $('#forecast').innerHTML = data.daily.time.map((day, index) => { const [dailyIcon] = weatherState(data.daily.weather_code[index]); return `<div class="forecast-day"><span>${index === 0 ? 'TODAY' : new Date(`${day}T12:00`).toLocaleDateString('en-ZA',{weekday:'short'}).toUpperCase()}</span><b>${dailyIcon}</b><strong><span class="t-max">${Math.round(data.daily.temperature_2m_max[index])}°</span><span class="t-sep"> / </span><span class="t-min">${Math.round(data.daily.temperature_2m_min[index])}°</span></strong></div>`; }).join('');

  // Night mode: dim the screen between sunset and sunrise at the profile's location. Open-Meteo gives
  // those times in the location's local time, so compare against "now" shifted by the same offset.
  const here = new Date(Date.now() + (data.utc_offset_seconds ?? 0) * 1000).toISOString().slice(0, 16);
  const [sunrise, sunset] = [data.daily.sunrise?.[0], data.daily.sunset?.[0]];
  document.body.classList.toggle('night', Boolean(sunrise && sunset) && (here < sunrise || here >= sunset));
}
let feeds = [];

async function loadFeeds() {
  const data = await fetch('/api/feeds').then(r => r.json());
  feeds = data.feeds || [];
  const picker = $('#news-picker');
  const regions = [...new Set(feeds.map(feed => feed.region))];
  picker.innerHTML = regions.map(region => `
    <p class="picker-region">${esc(region)}</p>
    ${feeds.filter(feed => feed.region === region).map(feed => `
      <label class="check-row"><input type="checkbox" name="news" value="${esc(feed.id)}"> ${esc(feed.name)}</label>
    `).join('')}
  `).join('');
}

async function loadNewsPanels() {
  const stack = $('#news-stack');
  const chosen = config.news ?? [];
  stack.innerHTML = chosen.map(id => {
    const feed = feeds.find(item => item.id === id) || { id, name: id, site: '#' };
    return `<article class="panel news-panel" data-feed="${esc(id)}">
      <div class="panel-heading">
        <div><p class="eyebrow section-label">${esc(feed.region || 'NEWS')}</p><h2 class="section-title">${esc(feed.name)}</h2></div>
        <div class="heading-actions">
          <button class="refresh" data-refresh="news" data-feed="${esc(id)}" aria-label="Refresh ${esc(feed.name)}">↻</button>
          <a href="${esc(safeUrl(feed.site))}" target="_blank" rel="noreferrer" class="source-link">OPEN ↗</a>
        </div>
      </div>
      <div class="news-list" id="news-${esc(id)}"><p class="loading">Loading…</p></div>
    </article>`;
  }).join('') || '<article class="panel"><p class="loading">No news channels selected. Open Settings to add some.</p></article>';

  await Promise.all(chosen.map(id => loadOneNews(id)));
}

async function loadOneNews(id) {
  const box = $(`#news-${id}`);
  if (!box) return;
  box.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const res = await fetch(`/api/news?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (!res.ok) throw Error(data.error);
    box.innerHTML = data.items.map((item, index) =>
      `<a class="news-item" href="${esc(safeUrl(item.link))}" target="_blank" rel="noreferrer"><span class="news-index">0${index + 1}</span><span>${esc(item.title)}</span></a>`
    ).join('') || '<p class="loading">No stories right now.</p>';
  } catch {
    box.innerHTML = '<p class="loading">Could not load this feed.</p>';
  }
}
async function loadSky() { try { const res = await fetch('/api/sky'); const data = await res.json(); if (!res.ok) throw Error(data.error); $('#sky-video').innerHTML = `<iframe title="Sky News live stream" src="https://www.youtube.com/embed/${data.videoId}?rel=0&autoplay=0&mute=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`; } catch (error) { $('#sky-video').innerHTML = `<div class="stream-message"><strong>Sky News is not live right now.</strong><a href="https://www.youtube.com/@SkyNews/streams" target="_blank" rel="noreferrer">Open Sky News on YouTube ↗</a></div>`; } }
const flowBadge = (el, watts, active) => {
  if (!el) return;
  if (!active || watts == null || Number.isNaN(Number(watts)) || Math.abs(Number(watts)) < 20) {
    el.textContent = '';
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.textContent = unit(watts);
};

// Time until the battery is empty (discharging) or full (charging) at the current rate.
// Empty when the capacity is not set, the inverter reports no state of charge, or the battery is idle.
function batteryRuntime(capacityKwh, percent, charging, watts) {
  const kwh = Number(capacityKwh), soc = Number(percent), w = Number(watts);
  if (!(kwh > 0) || percent == null || !Number.isFinite(soc) || !(w >= 20)) return '';
  const share = (charging ? 100 - soc : soc) / 100;
  if (share <= 0) return '';
  const minutes = Math.round(share * kwh * 1000 / w * 60);
  if (minutes >= 48 * 60) return charging ? 'Full in over 2 days' : 'Over 2 days left';
  const text = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  return charging ? `Full in ≈ ${text}` : `≈ ${text} left`;
}

async function loadSolar() {
  const requested = currentProfile;
  const res = await fetch(profileUrl('/api/solar'));
  const data = await res.json();
  if (requested !== currentProfile) return; // the profile was switched while this was loading
  const diagram = $('#solar-diagram');
  if (!data.configured) {
    $('#solar-source').textContent = 'Connect your solar system';
    $('#solar-flow-summary').textContent = '';
    $('#solar-updated').textContent = 'Open Settings, choose your solar provider and add its details.';
    return;
  }
  if (!res.ok || data.error) {
    $('#solar-source').textContent = data.error || 'Unknown error';
    $('#solar-flow-summary').textContent = '';
    return;
  }

  const charging = data.flowBatteryIn || (Number(data.batteryCharge) >= 20 && !(Number(data.battery) >= 20));
  const discharging = data.flowBatteryOut || (Number(data.battery) >= 20);

  // Primary heading = live mode / input; secondary = device type label
  const feeds = [];
  if (data.flowPv) feeds.push('PV');
  if (data.flowGrid) feeds.push('GRID');
  if (discharging) feeds.push('BATTERY');
  const primaryInput = data.status || (feeds.length ? feeds.join(' + ') : null) || data.activeSource || 'STANDBY';

  $('#solar-name').textContent = data.plant;
  $('#solar-pv').textContent = unit(data.pv);
  $('#solar-grid').textContent = unit(data.grid);
  $('#solar-consumption').textContent = unit(data.consumption);
  $('#solar-source').textContent = primaryInput;
  $('#solar-flow-summary').textContent = data.flowSummary || '';
  $('#solar-mode').textContent = feeds.length ? feeds.join(' + ') : (data.activeSource || 'STANDBY');

  // Battery shows voltage (e.g. 53.5 V), not percentage
  const v = data.batteryVoltage;
  $('#solar-battery-voltage').textContent =
    v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : `${Number(v).toFixed(1)} V`;

  const batLabel = charging ? 'Charging Power' : discharging ? 'Discharge Power' : 'Battery Power';
  const batWatts = charging ? data.batteryCharge : discharging ? data.battery : 0;
  $('#solar-battery-power-label').innerHTML = `${batLabel}: <strong id="solar-battery-power">${unit(batWatts)}</strong>`;
  const runtime = batteryRuntime(config?.batteryKwh, data.batteryPercent, charging, batWatts);
  $('#solar-battery-runtime').textContent = runtime;
  $('#solar-battery-runtime').hidden = !runtime;

  // Watt labels on each flow path
  flowBadge($('#flow-pv-badge'), data.pv, data.flowPv);
  flowBadge($('#flow-grid-badge'), data.grid, data.flowGrid);
  flowBadge($('#flow-load-badge'), data.consumption, data.flowLoad);
  flowBadge($('#flow-battery-badge'), charging ? data.batteryCharge : data.battery, charging || discharging);

  $('#solar-today').textContent = energy(data.today);
  $('#solar-total').textContent = energy(data.total);
  $('#solar-updated').textContent = data.updatedAt ? `UPDATED ${data.updatedAt}` : 'UPDATED JUST NOW';

  // Active source highlight + animated flow arrows (all active paths, not just dominant)
  diagram.dataset.source = (data.activeSource || 'standby').toLowerCase();
  diagram.classList.toggle('flow-pv-on', Boolean(data.flowPv));
  diagram.classList.toggle('flow-grid-on', Boolean(data.flowGrid));
  diagram.classList.toggle('flow-load-on', Boolean(data.flowLoad));
  diagram.classList.toggle('flow-bat-out', Boolean(discharging));
  diagram.classList.toggle('flow-bat-in', Boolean(charging) && !discharging);
}
// ---- Profiles ----------------------------------------------------------------------------
function renderProfileSelect() {
  const select = $('#profile-select');
  select.innerHTML = profileList.map(profile => `<option value="${esc(profile.id)}">${esc(profile.name)}</option>`).join('');
  select.value = currentProfile;
  select.hidden = profileList.length < 2;
}

async function loadProfiles() {
  const data = await api('/api/profiles');
  profileList = data.profiles;
  if (!profileList.some(profile => profile.id === currentProfile)) currentProfile = data.defaultProfile;
  renderProfileSelect();
}

function resetSolar() {
  const diagram = $('#solar-diagram');
  diagram.className = 'solar-diagram';
  diagram.dataset.source = 'standby';
  ['solar-pv', 'solar-grid', 'solar-consumption', 'solar-battery-voltage', 'solar-today', 'solar-total', 'solar-source', 'solar-flow-summary', 'solar-mode']
    .forEach(id => { $(`#${id}`).textContent = '—'; });
  $('#solar-name').textContent = 'Solar overview';
  $('#solar-updated').textContent = '';
  $('#solar-battery-power-label').innerHTML = '— <strong id="solar-battery-power">—</strong>';
  $('#solar-battery-runtime').hidden = true;
  document.querySelectorAll('.flow-badge').forEach(badge => { badge.textContent = ''; badge.hidden = true; });
}

let lastRefresh = null; // when the dashboard last reached its server
let weatherUpdated = null; // when the forecast on screen was fetched
const clockTime = date => date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

// Header badge: LIVE while refreshes reach the server, OFFLINE with the last good time when they do not.
function setConnection(ok) {
  const dot = $('.live-dot');
  if (ok) lastRefresh = new Date();
  dot.classList.toggle('offline', !ok);
  dot.textContent = ok ? 'LIVE' : lastRefresh ? `OFFLINE · ${clockTime(lastRefresh)}` : 'OFFLINE';
}

// Keep the last forecast on screen, but say it is old instead of passing it off as current.
function markWeatherStale(error) {
  console.error(error);
  $('#weather-feels').textContent = weatherUpdated
    ? `Weather unavailable · last update ${clockTime(weatherUpdated)}`
    : 'Weather unavailable right now';
}

async function loadAll({ includeSky = false } = {}) {
  updateClock(); // wall displays run for days: the date must follow the 15-minute refresh
  try {
    const requested = currentProfile;
    let data;
    try {
      data = await api(profileUrl('/api/config'));
    } catch (error) {
      setConnection(false); // the dashboard's own server did not answer: say so instead of showing old data as live
      throw error;
    }
    setConnection(true);
    // A newer load for another profile owns the screen now. Without this, a slow answer for the old
    // profile would also take the deleted-profile branch below and switch the screen back to it.
    if (requested !== currentProfile) return;
    config = data;
    if (config.id !== currentProfile) { // the saved profile was deleted: the server sent the default instead
      currentProfile = config.id;
      renderProfileSelect();
    }
    storage.set('md.profile', currentProfile);
    const tasks = [loadWeather().catch(markWeatherStale), loadNewsPanels(), loadSolar()];
    if (includeSky) tasks.push(loadSky());
    await Promise.all(tasks);
  } catch (error) {
    console.error(error);
  }
}

$('#profile-select').addEventListener('change', event => {
  currentProfile = event.target.value;
  storage.set('md.profile', currentProfile);
  resetSolar();
  loadAll({ includeSky: false });
});

// ---- Admin login -------------------------------------------------------------------------
function openAuth() {
  const form = $('#auth-form');
  const setup = session.setupRequired;
  $('#auth-title').textContent = setup ? 'Choose an admin password' : 'Unlock settings';
  $('#auth-intro').textContent = setup
    ? 'No admin password is set yet. Pick one (at least 8 characters). You will need it to change profiles and settings.'
    : 'Enter the admin password to change profiles and settings.';
  $('#auth-submit').textContent = setup ? 'Set password' : 'Unlock';
  $('#auth-confirm-row').hidden = !setup;
  form.elements.password.autocomplete = setup ? 'new-password' : 'current-password';
  form.elements.confirm.required = setup;
  $('#auth-status').textContent = '';
  form.reset();
  authDialog.showModal();
  form.elements.password.focus();
}

$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const status = $('#auth-status');
  const setup = session.setupRequired;
  const password = form.elements.password.value;
  if (setup && password.length < 8) { status.textContent = 'Use at least 8 characters.'; return; }
  if (setup && password !== form.elements.confirm.value) { status.textContent = 'The two passwords do not match.'; return; }
  status.textContent = setup ? 'Setting password…' : 'Checking…';
  try {
    await api(setup ? '/api/auth/setup' : '/api/auth/login', { method: 'POST', body: { password } });
    session = { ...session, authenticated: true, setupRequired: false };
    form.reset();
    authDialog.close();
    await openSettings(currentProfile);
  } catch (error) {
    status.textContent = error.message;
  }
});
$('#auth-close').addEventListener('click', () => authDialog.close());
$('#auth-cancel').addEventListener('click', () => authDialog.close());

// ---- Settings ----------------------------------------------------------------------------
const providerById = id => solarProviders.find(provider => provider.id === id);

// A profile with nothing saved yet, shaped like what /api/config returns.
function blankProfile() {
  return {
    id: '', name: '', isDefault: false,
    location: { name: '', latitude: '', longitude: '', timezone: 'Africa/Johannesburg' },
    solar: {
      provider: solarProviders[0]?.id ?? '',
      byProvider: Object.fromEntries(solarProviders.map(provider => [provider.id, { configured: false, values: provider.defaults, secretsSet: [] }]))
    },
    batteryKwh: null,
    news: ['daily-maverick', 'bbc']
  };
}

async function loadSolarProviders() {
  const data = await api('/api/solar-providers');
  solarProviders = data.providers;
}

// Draws the form for one provider. `saved` is what the server told us about this provider for this profile.
function renderSolarFields(providerId) {
  const provider = providerById(providerId);
  const saved = editingProfile?.solar.byProvider[providerId] ?? { configured: false, values: provider?.defaults ?? {}, secretsSet: [] };
  const box = $('#solar-fields');
  box.innerHTML = (provider?.fields ?? []).map(field => {
    const has = saved.secretsSet.includes(field.name);
    const placeholder = field.secret ? (has ? 'Saved. Leave blank to keep it' : field.placeholder) : field.placeholder;
    const value = field.secret ? '' : saved.values[field.name] ?? '';
    return `<label>${esc(field.label)}
      <input name="solar_${esc(field.name)}" type="${field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}"
        value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"${field.required ? ' required' : ''}>
    </label>`;
  }).join('');
  const status = $('#settings-status');
  const label = provider?.label ?? 'Solar';
  status.textContent = saved.configured ? `${label}: credentials saved` : `${label}: not connected yet`;
  status.classList.toggle('ok', Boolean(saved.configured));
}

function selectedNews() {
  return [...document.querySelectorAll('#news-picker input:checked')].map(input => input.value);
}

async function populateSettings(id) {
  const form = $('#settings-form');
  const status = $('#settings-status');
  editingId = id;
  const select = $('#edit-profile');
  select.innerHTML = profileList.map(profile => `<option value="${esc(profile.id)}">${esc(profile.name)}</option>`).join('')
    + (id ? '' : '<option value="">New profile…</option>');
  select.value = id;

  const data = id ? await api(`/api/config?profile=${encodeURIComponent(id)}`) : blankProfile();
  editingProfile = data;
  form.elements.profileName.value = data.name;
  form.elements.makeDefault.checked = data.isDefault;
  form.elements.makeDefault.disabled = data.isDefault; // pick another profile as default to move it
  form.elements.locationName.value = data.location.name || '';
  form.elements.latitude.value = data.location.latitude;
  form.elements.longitude.value = data.location.longitude;
  form.elements.timezone.value = data.location.timezone || 'Africa/Johannesburg';
  form.elements.batteryKwh.value = data.batteryKwh ?? '';
  const providerSelect = $('#solar-provider');
  providerSelect.innerHTML = solarProviders.map(provider => `<option value="${esc(provider.id)}">${esc(provider.label)}</option>`).join('');
  providerSelect.value = data.solar.provider;
  $('#solar-provider-row').hidden = solarProviders.length < 2; // nothing to choose between yet
  renderSolarFields(data.solar.provider);
  const chosen = new Set(data.news);
  document.querySelectorAll('#news-picker input[name="news"]').forEach(input => { input.checked = chosen.has(input.value); });
  $('#profile-delete').disabled = !id || profileList.length < 2;

  const managed = session.passwordManagedByEnv;
  $('#password-note').textContent = managed
    ? 'The password is set by the ADMIN_PASSWORD environment variable and cannot be changed here.'
    : 'Use at least 8 characters. Changing it signs out every other browser.';
  form.elements.currentPassword.disabled = managed;
  form.elements.newPassword.disabled = managed;
  $('#password-change').disabled = managed;
  $('#password-status').textContent = '';
  form.elements.currentPassword.value = '';
  form.elements.newPassword.value = '';
}

async function openSettings(id) {
  await loadProfiles();
  await populateSettings(profileList.some(profile => profile.id === id) ? id : currentProfile);
  if (!dialog.open) dialog.showModal();
}

$('#settings-button').addEventListener('click', async () => {
  try {
    session = await api('/api/session');
    if (session.authenticated) await openSettings(currentProfile);
    else openAuth();
  } catch (error) {
    console.error(error);
  }
});
$('#settings-close').addEventListener('click', () => dialog.close());
$('#settings-cancel').addEventListener('click', () => dialog.close());

$('#solar-provider').addEventListener('change', event => renderSolarFields(event.target.value));
$('#edit-profile').addEventListener('change', event => populateSettings(event.target.value));
$('#profile-new').addEventListener('click', async () => {
  await populateSettings('');
  $('#settings-form').elements.profileName.focus();
});

$('#profile-delete').addEventListener('click', async () => {
  const status = $('#settings-status');
  const profile = profileList.find(item => item.id === editingId);
  if (!profile || !confirm(`Delete the profile "${profile.name}"? Its saved solar credentials are deleted too.`)) return;
  try {
    await api(`/api/profiles/${encodeURIComponent(editingId)}`, { method: 'DELETE' });
    await loadProfiles(); // falls back to the default profile if this device was showing the deleted one
    await populateSettings(currentProfile);
    loadAll({ includeSky: false });
  } catch (error) {
    status.textContent = error.message;
    status.classList.remove('ok');
  }
});

let saving = false;

async function saveSettings() {
  if (saving) return; // a second click while the first save is in flight would create a new profile twice
  const form = $('#settings-form');
  const status = $('#settings-status');
  if (!form.reportValidity()) return;
  const body = {
    name: form.elements.profileName.value,
    location: {
      name: form.elements.locationName.value,
      latitude: form.elements.latitude.value,
      longitude: form.elements.longitude.value,
      timezone: form.elements.timezone.value
    },
    batteryKwh: form.elements.batteryKwh.value,
    solar: {
      provider: form.elements.solarProvider.value,
      values: Object.fromEntries((providerById(form.elements.solarProvider.value)?.fields ?? [])
        .map(field => [field.name, form.elements[`solar_${field.name}`]?.value ?? '']))
    },
    news: selectedNews(),
    makeDefault: form.elements.makeDefault.checked
  };
  status.textContent = 'Saving…';
  status.classList.remove('ok');
  saving = true;
  $('#save-settings').disabled = true;
  try {
    const data = editingId
      ? await api(`/api/profiles/${encodeURIComponent(editingId)}`, { method: 'PUT', body })
      : await api('/api/profiles', { method: 'POST', body });
    currentProfile = data.profile.id;
    dialog.close();
    await loadProfiles();
    await loadAll({ includeSky: false });
  } catch (error) {
    if (error.status === 401) { // the session expired while the dialog was open
      dialog.close();
      session.setupRequired = false;
      openAuth();
      return;
    }
    status.textContent = error.message;
  } finally {
    saving = false;
    $('#save-settings').disabled = false;
  }
}
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  saveSettings();
});
$('#save-settings').addEventListener('click', event => {
  event.preventDefault();
  saveSettings();
});

$('#password-change').addEventListener('click', async () => {
  const form = $('#settings-form');
  const status = $('#password-status');
  const next = form.elements.newPassword.value;
  if (next.length < 8) { status.classList.remove('ok'); status.textContent = 'The new password must be at least 8 characters.'; return; }
  try {
    await api('/api/auth/password', { method: 'POST', body: { current: form.elements.currentPassword.value, next } });
    form.elements.currentPassword.value = '';
    form.elements.newPassword.value = '';
    status.classList.add('ok');
    status.textContent = 'Password changed. Other browsers were signed out.';
  } catch (error) {
    status.classList.remove('ok');
    status.textContent = error.message;
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  session.authenticated = false;
  dialog.close();
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-refresh]');
  if (!button) return;
  const kind = button.dataset.refresh;
  if (kind === 'weather') loadWeather().catch(markWeatherStale);
  else if (kind === 'solar') loadSolar();
  else if (kind === 'news' && button.dataset.feed) loadOneNews(button.dataset.feed);
});
updateClock();
// Sky News only on first load so the live embed is not torn down every 15 minutes
Promise.all([loadFeeds(), loadProfiles(), loadSolarProviders()]).then(() => loadAll({ includeSky: true }));
setInterval(() => loadAll({ includeSky: false }), 15 * 60 * 1000);
