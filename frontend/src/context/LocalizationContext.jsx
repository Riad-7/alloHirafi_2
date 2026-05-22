import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getCurrentLocale, setCurrentLocale as persistLocale } from '../services/api.js';

const LocalizationContext = createContext(null);

function interpolate(message, replacements = {}) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replaceAll(`:${key}`, String(value)),
    message,
  );
}

export function LocalizationProvider({ children }) {
  const [locale, setLocale] = useState(getCurrentLocale());
  const [messages, setMessages] = useState({});
  const [direction, setDirection] = useState(locale === 'ar' ? 'rtl' : 'ltr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const data = await apiRequest(`/localization?locale=${locale}`);

        if (cancelled) {
          return;
        }

        setMessages(data.messages ?? {});
        setDirection(data.direction ?? (locale === 'ar' ? 'rtl' : 'ltr'));
        setReady(true);
      } catch {
        if (!cancelled) {
          setMessages({});
          setDirection(locale === 'ar' ? 'rtl' : 'ltr');
          setReady(true);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  const switchLocale = async (nextLocale) => {
    persistLocale(nextLocale);
    setLocale(nextLocale);

    try {
      const data = await apiRequest('/localization', {
        method: 'POST',
        body: { locale: nextLocale },
      });

      setMessages(data.messages ?? {});
      setDirection(data.direction ?? (nextLocale === 'ar' ? 'rtl' : 'ltr'));
    } catch {
      setDirection(nextLocale === 'ar' ? 'rtl' : 'ltr');
    }
  };

  const value = useMemo(() => ({
    locale,
    direction,
    ready,
    setLocale: switchLocale,
    t: (key, replacements = {}) => interpolate(messages[key] ?? key, replacements),
  }), [direction, locale, messages, ready]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocalization() {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  return context;
}
