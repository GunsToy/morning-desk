import growatt from './growatt.mjs';
import victron from './victron.mjs';

// To add a provider: write providers/<name>.mjs (see common.mjs for the shape) and list it here.
const all = [growatt, victron];
const byId = new Map(all.map(provider => [provider.id, provider]));

export const DEFAULT_PROVIDER = 'growatt';
export const list = () => all;
export const get = id => byId.get(id);
export const has = id => byId.has(id);
