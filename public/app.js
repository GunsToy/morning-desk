const $ = selector => document.querySelector(selector);
const dialog = $('#settings-dialog');
let config;

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
  const res = await fetch('/api/weather'); const data = await res.json(); if (!res.ok) throw Error(data.error);
  $('#weather-place').textContent = data.location; const [icon, condition] = weatherState(data.current.weather_code);
  $('#weather-icon').textContent = icon; $('#weather-temp').textContent = `${Math.round(data.current.temperature_2m)}°`; $('#weather-condition').textContent = condition; $('#weather-feels').textContent = `Feels like ${Math.round(data.current.apparent_temperature)}° · ${Math.round(data.current.wind_speed_10m)} km/h`;
  $('#forecast').innerHTML = data.daily.time.map((day, index) => { const [dailyIcon] = weatherState(data.daily.weather_code[index]); return `<div class="forecast-day"><span>${index === 0 ? 'TODAY' : new Date(`${day}T12:00`).toLocaleDateString('en-ZA',{weekday:'short'}).toUpperCase()}</span><b>${dailyIcon}</b><strong>${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°</strong></div>`; }).join('');
}
async function loadNews() { try { const res = await fetch('/api/news'); const data = await res.json(); if (!res.ok) throw Error(data.error); $('#news-list').innerHTML = data.items.map((item,index) => `<a class="news-item" href="${item.link}" target="_blank" rel="noreferrer"><span class="news-index">0${index+1}</span><span>${item.title}</span></a>`).join(''); } catch (error) { $('#news-list').innerHTML = `<p class="loading">Could not load stories. <button class="text-button" onclick="loadNews()">Try again</button></p>`; } }
async function loadCnn() { try { const res = await fetch('/api/cnn'); const data = await res.json(); if (!res.ok) throw Error(data.error); $('#cnn-list').innerHTML = data.items.map((item,index) => `<a class="news-item" href="${item.link}" target="_blank" rel="noreferrer"><span class="news-index">0${index+1}</span><span>${item.title}</span></a>`).join(''); } catch (error) { $('#cnn-list').innerHTML = '<p class="loading">Could not load CNN headlines.</p>'; } }
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

async function loadSolar() {
  const res = await fetch('/api/solar');
  const data = await res.json();
  const diagram = $('#solar-diagram');
  if (!data.configured) {
    $('#solar-source').textContent = 'Connect Growatt';
    $('#solar-flow-summary').textContent = '';
    $('#solar-updated').textContent = 'Use the gear icon to add your Growatt API token.';
    return;
  }
  if (!res.ok || data.error) {
    $('#solar-source').textContent = data.error || 'Unknown error';
    $('#solar-flow-summary').textContent = '';
    return;
  }

  const charging = data.flowBatteryIn || (Number(data.batteryCharge) >= 20 && !(Number(data.battery) >= 20));
  const discharging = data.flowBatteryOut || (Number(data.battery) >= 20);

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

  const v = data.batteryVoltage;
  $('#solar-battery-voltage').textContent =
    v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : `${Number(v).toFixed(1)} V`;

  const batLabel = charging ? 'Charging Power' : discharging ? 'Discharge Power' : 'Battery Power';
  const batWatts = charging ? data.batteryCharge : discharging ? data.battery : 0;
  $('#solar-battery-power-label').innerHTML = `${batLabel}: <strong id="solar-battery-power">${unit(batWatts)}</strong>`;

  flowBadge($('#flow-pv-badge'), data.pv, data.flowPv);
  flowBadge($('#flow-grid-badge'), data.grid, data.flowGrid);
  flowBadge($('#flow-load-badge'), data.consumption, data.flowLoad);
  flowBadge($('#flow-battery-badge'), charging ? data.batteryCharge : data.battery, charging || discharging);

  $('#solar-today').textContent = energy(data.today);
  $('#solar-total').textContent = energy(data.total);
  $('#solar-updated').textContent = data.updatedAt ? `UPDATED ${data.updatedAt}` : 'UPDATED JUST NOW';

  diagram.dataset.source = (data.activeSource || 'standby').toLowerCase();
  diagram.classList.toggle('flow-pv-on', Boolean(data.flowPv));
  diagram.classList.toggle('flow-grid-on', Boolean(data.flowGrid));
  diagram.classList.toggle('flow-load-on', Boolean(data.flowLoad));
  diagram.classList.toggle('flow-bat-out', Boolean(discharging));
  diagram.classList.toggle('flow-bat-in', Boolean(charging) && !discharging);
}
async function loadAll({ includeSky = false } = {}) {
  try {
    config = await fetch('/api/config').then(r => r.json());
    const tasks = [loadWeather(), loadNews(), loadCnn(), loadSolar()];
    if (includeSky) tasks.push(loadSky());
    await Promise.all(tasks);
  } catch (error) {
    console.error(error);
  }
}
$('#settings-button').addEventListener('click', () => { const form = $('#settings-form'); form.locationName.value = config.location.name; form.latitude.value = config.location.latitude; form.longitude.value = config.location.longitude; form.growattServer.value = config.growattServer || form.growattServer.value; form.growattApiToken.value = ''; dialog.showModal(); });
$('#settings-form').addEventListener('submit', async event => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const form = event.currentTarget; const payload = { location:{ name:form.locationName.value, latitude:Number(form.latitude.value), longitude:Number(form.longitude.value) }, growatt:{ server:form.growattServer.value, apiToken:form.growattApiToken.value } }; await fetch('/api/config',{ method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload) }); dialog.close(); await loadAll({ includeSky: false }); });
document.querySelectorAll('[data-refresh]').forEach(button => button.addEventListener('click', () => button.dataset.refresh === 'weather' ? loadWeather() : loadSolar()));
updateClock();
loadAll({ includeSky: true });
setInterval(() => loadAll({ includeSky: false }), 15 * 60 * 1000);
