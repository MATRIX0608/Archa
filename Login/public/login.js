import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAK8PgnYOyCqbxKfj8lRzm7HPLiR47SOFo",
  authDomain: "hidden-india-login.firebaseapp.com",
  projectId: "hidden-india-login",
  storageBucket: "hidden-india-login.firebasestorage.app",
  messagingSenderId: "378826802839",
  appId: "1:378826802839:web:288e4cfc0c0afa3a0d4bd2",
  measurementId: "G-N8XSQ6YMFK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const panels = ['login', 'forgot', 'create'];
const BACKEND_URL = window.BACKEND_URL || 'http://localhost:3000';

function goto(name) {
  panels.forEach(panel => {
    const el = document.getElementById('panel-' + panel);
    if (el) el.classList.toggle('active', panel === name);
  });
  if (name === 'forgot') hideToast('forgot-toast');
  if (name === 'create') hideToast('create-toast');
}

document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', () => goto(el.getAttribute('data-goto')));
});

document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.getAttribute('data-target'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
  });
});

function setError(fieldId, msgId, message) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(msgId).textContent = message;
}

function clearError(fieldId, msgId) {
  document.getElementById(fieldId).classList.remove('error');
  document.getElementById(msgId).textContent = '';
}

function showToast(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.add('show');
}

function hideToast(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function firebaseMessage(error) {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    default:
      return error.message || 'Something went wrong.';
  }
}

async function syncUserWithBackend(user) {
  const idToken = await user.getIdToken();
  const response = await fetch(BACKEND_URL + '/api/users/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + idToken
    },
    body: JSON.stringify({
      name: user.displayName || 'User',
      email: user.email || ''
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Could not save your profile.');
  return data;
}

// LOGIN
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;

  clearError('login-email-field', 'login-email-msg');
  clearError('login-pass-field', 'login-pass-msg');
  hideToast('login-toast');

  let ok = true;
  if (!validEmail(email)) {
    setError('login-email-field', 'login-email-msg', 'Enter a valid email address.');
    ok = false;
  }
  if (!pass) {
    setError('login-pass-field', 'login-pass-msg', 'Enter your password.');
    ok = false;
  }
  if (!ok) return;

  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Signing in...';

  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserWithBackend(result.user);
    showToast('login-toast', 'Signed in successfully.');
    setTimeout(() => {
    window.location.href = '/Homepage/index.html';
  }, 1000);
  } catch (error) {
    console.error(error);
    showToast('login-toast', firebaseMessage(error));
  } finally {
    button.disabled = false;
    button.textContent = 'Sign in';
  }
});

// FORGOT PASSWORD
const forgotForm = document.getElementById('forgot-request-form');
forgotForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim().toLowerCase();

  clearError('forgot-email-field', 'forgot-email-msg');
  hideToast('forgot-toast');

  if (!validEmail(email)) {
    setError('forgot-email-field', 'forgot-email-msg', 'Enter a valid email address.');
    return;
  }

  const button = forgotForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Sending...';

  try {
    await sendPasswordResetEmail(auth, email);
    showToast('forgot-toast', 'Password reset link sent. Check your inbox and spam folder.');
  } catch (error) {
    console.error(error);
    showToast('forgot-toast', firebaseMessage(error));
  } finally {
    button.disabled = false;
    button.textContent = 'Send reset link';
  }
});

// CREATE ACCOUNT
const createForm = document.getElementById('create-form');
createForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('create-name').value.trim();
  const email = document.getElementById('create-email').value.trim().toLowerCase();

  clearError('create-name-field', 'create-name-msg');
  clearError('create-email-field', 'create-email-msg');
  hideToast('create-toast');

  let ok = true;
  if (name.length < 2) {
    setError('create-name-field', 'create-name-msg', 'Enter your full name.');
    ok = false;
  }
  if (!validEmail(email)) {
    setError('create-email-field', 'create-email-msg', 'Enter a valid email address.');
    ok = false;
  }
  if (!ok) return;

  // Move to the existing password screen for account creation.
  window.createAccountName = name;
  window.createAccountEmail = email;
  goto('newpass');
});

// Create-account password screen is added here because the old HTML had one.
const newPassPanel = document.createElement('section');
newPassPanel.className = 'panel';
newPassPanel.id = 'panel-newpass';
newPassPanel.innerHTML = `
  <div class="back-row">
    <button type="button" id="back-create" aria-label="Back to create account">&larr;</button>
    <h1 class="formtitle" style="margin:0;">Create password</h1>
  </div>
  <p class="formsub">Choose a strong password for your account.</p>
  <div class="toast" id="newpass-toast"></div>
  <form id="newpass-form" novalidate>
    <div class="field" id="newpass1-field">
      <label for="newpass1">Password</label>
      <div class="pw-wrap">
        <input type="password" id="newpass1" placeholder="At least 8 characters" autocomplete="new-password">
        <button type="button" class="pw-toggle" data-target="newpass1">Show</button>
      </div>
      <div class="strength"><div class="strength-bar" id="strength-bar"></div></div>
      <div class="strength-label" id="strength-label">Password strength</div>
      <div class="field-msg" id="newpass1-msg"></div>
    </div>
    <div class="field" id="newpass2-field">
      <label for="newpass2">Confirm password</label>
      <div class="pw-wrap">
        <input type="password" id="newpass2" placeholder="Re-enter password" autocomplete="new-password">
        <button type="button" class="pw-toggle" data-target="newpass2">Show</button>
      </div>
      <div class="field-msg" id="newpass2-msg"></div>
    </div>
    <button type="submit" class="primary">Create account</button>
  </form>`;
document.querySelector('.stage').appendChild(newPassPanel);
panels.push('newpass');

document.getElementById('back-create').addEventListener('click', () => goto('create'));
document.querySelectorAll('#panel-newpass .pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.getAttribute('data-target'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
  });
});

const p1 = document.getElementById('newpass1');
const bar = document.getElementById('strength-bar');
const label = document.getElementById('strength-label');
p1.addEventListener('input', function() {
  const value = p1.value;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const pct = (score / 4) * 100;
  bar.style.width = pct + '%';
  const colors = ['#c0392b', '#c0392b', '#e8452c', '#f2994a', '#27ae60'];
  bar.style.background = colors[score];
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  label.textContent = value.length ? labels[score] : 'Password strength';
});

document.getElementById('newpass-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const password = document.getElementById('newpass1').value;
  const confirm = document.getElementById('newpass2').value;
  clearError('newpass1-field', 'newpass1-msg');
  clearError('newpass2-field', 'newpass2-msg');
  hideToast('newpass-toast');

  let ok = true;
  if (password.length < 8) {
    setError('newpass1-field', 'newpass1-msg', 'Use at least 8 characters.');
    ok = false;
  }
  if (confirm !== password || !confirm) {
    setError('newpass2-field', 'newpass2-msg', 'Passwords do not match.');
    ok = false;
  }
  if (!ok) return;

  const button = this.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Creating...';

  try {
    const result = await createUserWithEmailAndPassword(auth, window.createAccountEmail, password);
    await updateProfile(result.user, { displayName: window.createAccountName });
    await syncUserWithBackend(result.user);
    showToast('newpass-toast', 'Account created successfully.');
    setTimeout(() => goto('login'), 1000);
  } catch (error) {
    console.error(error);
    showToast('newpass-toast', firebaseMessage(error));
  } finally {
    button.disabled = false;
    button.textContent = 'Create account';
  }
});
