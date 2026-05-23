import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { BACKEND_URL, ensureCsrfCookie, getCurrentLocale, getXsrfToken } from './api.js';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

let echoInstance = null;

function buildRealtimeConfig() {
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
  const isTls = scheme === 'https';

  return {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local-key',
    wsHost: import.meta.env.VITE_REVERB_HOST ?? browserHost,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: isTls,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        try {
          await ensureCsrfCookie();

          const headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Locale': getCurrentLocale(),
          };

          const xsrfToken = getXsrfToken();

          if (xsrfToken) {
            headers['X-XSRF-TOKEN'] = xsrfToken;
          }

          const response = await fetch(`${BACKEND_URL}/broadcasting/auth`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Realtime auth failed.');
          }

          callback(false, data);
        } catch (error) {
          callback(true, error);
        }
      },
    }),
  };
}

export function getEcho() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (echoInstance) {
    return echoInstance;
  }

  window.Pusher = Pusher;
  echoInstance = new Echo(buildRealtimeConfig());

  return echoInstance;
}

export function disconnectEcho() {
  if (!echoInstance) {
    return;
  }

  echoInstance.disconnect();
  echoInstance = null;
}
