// PKCE OAuth flow for Spotify — no client secret needed, safe for a front-end-only app.

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://127.0.0.1:5173/callback';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function generateRandomString(length = 64) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => possible[v % possible.length]).join('');
}

export async function redirectToSpotifyLogin() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  window.localStorage.setItem('moodring_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const codeVerifier = window.localStorage.getItem('moodring_code_verifier');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = await response.json();
  storeTokens(data);
  return data;
}

export async function refreshAccessToken() {
  const refreshToken = window.localStorage.getItem('moodring_refresh_token');
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) return null;
  const data = await response.json();
  storeTokens(data);
  return data;
}

function storeTokens(data) {
  window.localStorage.setItem('moodring_access_token', data.access_token);
  window.localStorage.setItem('moodring_token_expires', String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) {
    window.localStorage.setItem('moodring_refresh_token', data.refresh_token);
  }
}

export async function getValidAccessToken() {
  const token = window.localStorage.getItem('moodring_access_token');
  const expires = Number(window.localStorage.getItem('moodring_token_expires') || 0);

  if (token && Date.now() < expires - 10000) {
    return token;
  }

  const refreshed = await refreshAccessToken();
  return refreshed ? refreshed.access_token : null;
}

export function logout() {
  ['moodring_access_token', 'moodring_refresh_token', 'moodring_token_expires', 'moodring_code_verifier'].forEach((k) =>
    window.localStorage.removeItem(k)
  );
}

export function isLoggedIn() {
  return Boolean(window.localStorage.getItem('moodring_access_token'));
}
