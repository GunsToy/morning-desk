import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export const COOKIE_NAME = 'md_session';
export const SESSION_TTL = 12 * 60 * 60 * 1000;
export const REMEMBER_TTL = 90 * 24 * 60 * 60 * 1000; // "Remember me", so wall displays stay signed in

// sha256(token) -> { who: 'admin' | profile id, expires (ms), remember }.
// server.mjs mirrors this into config.json, so restarts and the nightly update keep people signed in.
// Only hashes are kept, so a copy of config.json cannot be used to sign in.
const sessions = new Map();
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

// Checked against when the username is unknown, so a wrong name takes as long as a wrong password.
export const DUMMY_RECORD = await hashPassword(crypto.randomBytes(16).toString('hex'));

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      try { return decodeURIComponent(rest.join('=')); } catch { return null; }
    }
  }
  return null;
}

// { token, who, remember } for a signed-in request, otherwise null.
export function sessionFromReq(req) {
  const token = readCookie(req, COOKIE_NAME);
  if (!token) return null;
  const hash = hashToken(token);
  const session = sessions.get(hash);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(hash);
    return null;
  }
  return { token, who: session.who, remember: session.remember };
}

export function createSession(who, remember = false) {
  const now = Date.now();
  for (const [hash, session] of sessions) if (session.expires < now) sessions.delete(hash);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(hashToken(token), { who, expires: now + (remember ? REMEMBER_TTL : SESSION_TTL), remember: Boolean(remember) });
  return token;
}

export const destroySession = token => sessions.delete(hashToken(token));
export function destroySessionsFor(who) {
  for (const [hash, session] of sessions) if (session.who === who) sessions.delete(hash);
}

export const sessionList = () => [...sessions]
  .filter(([, session]) => session.expires > Date.now())
  .map(([hash, session]) => ({ hash, ...session }));

export function restoreSessions(list = []) {
  for (const { hash, who, expires, remember } of list) sessions.set(hash, { who, expires, remember });
}

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
