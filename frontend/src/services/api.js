const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

let authToken = localStorage.getItem('alohirafi_token');

export function setApiToken(token) {
  authToken = token;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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
