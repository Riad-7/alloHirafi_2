const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const configuredApiUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000/api`;

function normalizeLocalUrl(url) {
  if (!['localhost', '127.0.0.1'].includes(browserHost)) {
    return url;
  }

  return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(?=:\d+|\/|$)/, `http://${browserHost}`);
}

export const API_URL = normalizeLocalUrl(configuredApiUrl);
export const BACKEND_URL = normalizeLocalUrl(import.meta.env.VITE_BACKEND_URL ?? API_URL.replace(/\/api\/?$/, ''));
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LOCALE_STORAGE_KEY = 'alohirafi.locale';

let csrfReady = false;
let csrfPromise = null;

export function getCurrentLocale() {
  if (typeof window === 'undefined') {
    return 'fr';
  }

  return window.localStorage.getItem(LOCALE_STORAGE_KEY) || 'fr';
}

export function setCurrentLocale(locale) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

function readCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

export function getXsrfToken() {
  return readCookie('XSRF-TOKEN');
}

export async function ensureCsrfCookie() {
  if (csrfReady) {
    return;
  }

  if (!csrfPromise) {
    csrfPromise = fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Impossible de preparer la session CSRF.');
        }

        if (!getXsrfToken()) {
          throw new Error(
            'CSRF cookie introuvable. Utilise le meme host pour frontend/backend (localhost-localhost ou 127.0.0.1-127.0.0.1).',
          );
        }

        csrfReady = true;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

async function requestJson(url, options = {}, retriedAfterCsrfMismatch = false) {
  const method = (options.method ?? 'GET').toUpperCase();

  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfCookie();
  }

  const headers = {
    Accept: 'application/json',
    'X-Locale': getCurrentLocale(),
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const xsrfToken = getXsrfToken();
  if (xsrfToken && !SAFE_METHODS.has(method)) {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  const response = await fetch(url, {
    ...options,
    method,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? (options.body instanceof FormData ? options.body : JSON.stringify(options.body)) : undefined,
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (response.status === 419 && !retriedAfterCsrfMismatch && !SAFE_METHODS.has(method)) {
    csrfReady = false;
    csrfPromise = null;
    await ensureCsrfCookie();
    return requestJson(url, options, true);
  }

  if (!response.ok) {
    const message = data.message ?? 'Une erreur est survenue.';
    throw new Error(message);
  }

  return data;
}

export function apiRequest(path, options = {}) {
  return requestJson(`${API_URL}${path}`, options);
}

export function authRequest(path, options = {}) {
  return requestJson(`${BACKEND_URL}${path}`, options);
}
