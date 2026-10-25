const $ = selector => document.querySelector(selector);
const form = $('#login-form');
const status = $('#login-status');
let setup = false;

// First run: no admin password yet, so this page sets one instead of signing in.
function showSetup() {
  setup = true;
  $('#login-title').textContent = 'Set up Morning Desk';
  $('#login-intro').textContent = 'Choose the house admin password (at least 8 characters). The admin signs in as "admin" and gives each profile its own sign-in.';
  $('#login-intro').hidden = false;
  form.elements.username.value = 'admin';
  form.elements.username.readOnly = true;
  form.elements.password.autocomplete = 'new-password';
  $('#login-confirm-row').hidden = false;
  form.elements.confirm.required = true;
  $('#login-submit').textContent = 'Create admin password';
  $('#login-note').hidden = true;
}

fetch('/api/session').then(res => res.json()).then(session => {
  if (session.authenticated) location.replace('/');
  else if (session.setupRequired) showSetup();
}).catch(() => { /* the form still works; the server answers the sign-in itself */ });

$('#login-eye').addEventListener('click', event => {
  const button = event.currentTarget;
  const show = button.getAttribute('aria-pressed') !== 'true';
  for (const input of [form.elements.password, form.elements.confirm]) input.type = show ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  button.querySelector('.eye-show').hidden = show;
  button.querySelector('.eye-hide').hidden = !show;
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const password = form.elements.password.value;
  if (setup && password.length < 8) { status.textContent = 'Use at least 8 characters.'; return; }
  if (setup && password !== form.elements.confirm.value) { status.textContent = 'The two passwords do not match.'; return; }
  status.textContent = '';
  $('#login-submit').disabled = true;
  try {
    const res = await fetch(setup ? '/api/auth/setup' : '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.elements.username.value, password, remember: form.elements.remember.checked })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Sign-in failed (${res.status})`);
    location.replace('/');
  } catch (error) {
    status.textContent = error.message === 'Failed to fetch' ? 'Morning Desk did not answer. Check the connection and try again.' : error.message;
    form.elements.password.select();
  } finally {
    $('#login-submit').disabled = false;
  }
});
