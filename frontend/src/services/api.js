const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_URL = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000/api`;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? API_URL.replace(/\/api\/?$/, '');
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let csrfReady = false;
let csrfPromise = null;

function readCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

async function ensureCsrfCookie() {
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

        if (!readCookie('XSRF-TOKEN')) {
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

async function requestJson(url, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase();

  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfCookie();
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const xsrfToken = readCookie('XSRF-TOKEN');
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
