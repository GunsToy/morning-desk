import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export const COOKIE_NAME = 'md_session';
export const SESSION_TTL = 12 * 60 * 60 * 1000;

const sessions = new Map(); // token -> expiry time (ms). Lives in memory, so a restart signs everyone out.
const failures = new Map(); // ip -> { count, first }
const FAIL_WINDOW = 10 * 60 * 1000;
const MAX_FAILS = 8;

export async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const key = await scrypt(password, salt, 64);
  return { salt, hash: key.toString('hex') };
}

export async function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const key = await scrypt(String(password), record.salt, 64);
  const expected = Buffer.from(record.hash, 'hex');
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

// Optional: ADMIN_PASSWORD in the environment replaces the stored password and cannot be changed from the UI.
const envPassword = process.env.ADMIN_PASSWORD || '';
const envRecord = envPassword ? await hashPassword(envPassword) : null;
export const envManaged = () => Boolean(envRecord);
export const effectiveRecord = config => envRecord ?? config.admin ?? null;

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      try { return decodeURIComponent(rest.join('=')); } catch { return null; }
    }
  }
  return null;
}

export function sessionFromReq(req) {
  const token = readCookie(req, COOKIE_NAME);
  const expires = token ? sessions.get(token) : undefined;
  if (!expires) return null;
  if (expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return token;
}

export function createSession() {
  const now = Date.now();
  for (const [token, expires] of sessions) if (expires < now) sessions.delete(token);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, now + SESSION_TTL);
  return token;
}

export const destroySession = token => sessions.delete(token);
export const destroyAllSessions = () => sessions.clear();

// Seconds until this address may try again, or 0 if it is not locked out.
export function loginRetryAfter(ip) {
  const entry = failures.get(ip);
  if (!entry) return 0;
  const age = Date.now() - entry.first;
  if (age > FAIL_WINDOW) {
    failures.delete(ip);
    return 0;
  }
  return entry.count >= MAX_FAILS ? Math.ceil((FAIL_WINDOW - age) / 1000) : 0;
}

export function recordFailure(ip) {
  const now = Date.now();
  if (failures.size > 1000) for (const [key, entry] of failures) if (now - entry.first > FAIL_WINDOW) failures.delete(key);
  const entry = failures.get(ip);
  if (!entry || now - entry.first > FAIL_WINDOW) failures.set(ip, { count: 1, first: now });
  else entry.count += 1;
}

export const clearFailures = ip => failures.delete(ip);
