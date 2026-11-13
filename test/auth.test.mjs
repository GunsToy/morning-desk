// Sessions: signing in again and again must not grow the session list (and config.json) without limit.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as auth from '../auth.mjs';

test('one sign-in keeps at most MAX_SESSIONS_PER_SIGN_IN sessions, dropping the oldest', () => {
  const tokens = Array.from({ length: auth.MAX_SESSIONS_PER_SIGN_IN + 5 }, () => auth.createSession('home', true));
  const other = auth.createSession('kid');
  assert.equal(auth.sessionList().filter(session => session.who === 'home').length, auth.MAX_SESSIONS_PER_SIGN_IN);
  const signedIn = token => Boolean(auth.sessionFromReq({ headers: { cookie: `md_session=${token}` } }));
  assert.equal(signedIn(tokens[0]), false, 'the oldest is signed out');
  assert.equal(signedIn(tokens.at(-1)), true, 'the newest stays');
  assert.equal(signedIn(other), true, 'another sign-in is not affected');
});

test('restored sessions are trimmed the same way', () => {
  const list = Array.from({ length: 30 }, (_, i) => ({ hash: `restored-${i}`, who: 'wall', expires: Date.now() + 60_000, remember: true }));
  auth.restoreSessions(list);
  const kept = auth.sessionList().filter(session => session.who === 'wall').map(session => session.hash);
  assert.equal(kept.length, auth.MAX_SESSIONS_PER_SIGN_IN);
  assert.ok(kept.includes('restored-29') && !kept.includes('restored-0'));
});
