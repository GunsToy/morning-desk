// Grid voltage tells the dashboard whether the grid is up, even while nothing is imported from it.
// Run with: npm test
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import growatt from '../providers/growatt.mjs';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

// Answers like Growatt's OpenAPI, with `live` as the inverter's latest device data.
async function readings(live) {
  globalThis.fetch = async url => {
    const u = String(url);
    const body = u.includes('queryLastData') ? { code: 0, data: { storage: [live] } }
      : u.includes('plant/list') ? { error_code: 0, data: { plants: [{ plant_id: 1, plantName: 'Home' }] } }
      : u.includes('device/list') ? { error_code: 0, data: { devices: [{ device_sn: 'X', device_type: 2 }] } }
      : { error_code: 0, data: {} };
    return { ok: true, text: async () => JSON.stringify(body), json: async () => body };
  };
  return growatt.fetchReadings({ server: 'https://openapi.growatt.com/v1', apiToken: 'token' });
}

test('grid voltage is read while nothing is imported', async () => {
  const data = await readings({ vGrid: '231.4', vac: '230', pAcInPut: '0' });
  assert.equal(data.gridVoltage, 231.4);
  assert.equal(data.flowGrid, false);
});

test('an outage reads 0 V, not the inverter output voltage', async () => {
  assert.equal((await readings({ vGrid: '0', vac: '230' })).gridVoltage, 0);
});

test('grid voltage is null when the inverter does not report it', async () => {
  assert.equal((await readings({ vac: '230' })).gridVoltage, null);
});
