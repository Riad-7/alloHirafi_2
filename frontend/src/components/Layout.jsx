import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { apiRequest } from '../services/api.js';
import { getEcho } from '../services/realtime.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

function upsertNotification(currentNotifications, incomingNotification) {
  const nextNotifications = [...currentNotifications];
  const existingIndex = nextNotifications.findIndex((notification) => notification.id === incomingNotification.id);

  if (existingIndex >= 0) {
    nextNotifications[existingIndex] = incomingNotification;
  } else {
    nextNotifications.unshift(incomingNotification);
  }

  return nextNotifications
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
    .slice(0, 40);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocalization();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const languageMenuRef = useRef(null);

  const currentLanguageIcon = useMemo(() => (locale === 'ar' ? '🇲🇦' : '🇫🇷'), [locale]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowNotifications(false);
    setShowLanguageMenu(false);
  }, [location.pathname]);

  const syncNotification = useCallback((incomingNotification, nextUnreadCount = null) => {
    setNotifications((currentNotifications) => upsertNotification(currentNotifications, incomingNotification));

    if (typeof nextUnreadCount === 'number') {
      setUnreadCount(nextUnreadCount);
      return;
    }

    setUnreadCount((currentUnreadCount) => (
      incomingNotification.read_at ? Math.max(0, currentUnreadCount - 1) : currentUnreadCount + 1
    ));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      if (!user) {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
        return;
      }

      try {
        const data = await apiRequest('/notifications');

        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const echo = getEcho();

    if (!echo) {
      return undefined;
    }

    const channel = echo.private(`users.${user.id}.notifications`);
    const handleNotificationSynced = (payload) => {
      syncNotification(payload.notification, payload.unread_count);
    };

    channel.listen('.notification.synced', handleNotificationSynced);

    return () => {
      channel.stopListening('.notification.synced');
      echo.leave(`private-users.${user.id}.notifications`);
    };
  }, [syncNotification, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markNotificationRead = async (notificationId) => {
    try {
      const data = await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      syncNotification(data.notification, data.unread_count);
    } catch {
      // ignore
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark">AH</span>
          <div>
            <strong>{t('app.name')}</strong>
            <p>{t('app.tagline')}</p>
          </div>
        </NavLink>

        <button
          type="button"
          className={`topbar-toggle ${showMobileMenu ? 'active' : ''}`}
          aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
          aria-expanded={showMobileMenu}
          onClick={() => setShowMobileMenu((open) => !open)}
        >
          <span>{showMobileMenu ? 'X' : '☰'}</span>
        </button>

        <div className={`topbar-panel ${showMobileMenu ? 'open' : ''}`}>
          <nav className="main-nav">
            <NavLink to="/">{t('common.home')}</NavLink>
            {user?.role !== 'admin' && <NavLink to="/search">{t('common.search')}</NavLink>}
            {user?.role === 'artisan' && <NavLink to="/annonces">{t('common.ads')}</NavLink>}
            {user ? <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'}>{t('common.dashboard')}</NavLink> : null}
            {user && user.role !== 'admin' ? (
              <NavLink to="/inbox" className="inbox-link">
                {t('common.inbox')}
              </NavLink>
            ) : null}
            {user ? <NavLink to="/profile">{t('common.profile')}</NavLink> : null}
          </nav>

          <div className="topbar-actions">
            <div className="language-switcher" ref={languageMenuRef}>
              <button
                type="button"
                className="language-select"
                aria-label={t('layout.language')}
                aria-expanded={showLanguageMenu}
                onClick={() => setShowLanguageMenu((open) => !open)}
              >
                <span className="language-flag" aria-hidden="true">{currentLanguageIcon}</span>
              </button>

              {showLanguageMenu ? (
                <div className="language-switcher-options" role="listbox" aria-label={t('layout.language')}>
                  <button
                    type="button"
                    className={`language-option ${locale === 'fr' ? 'active' : ''}`}
                    onClick={() => {
                      setLocale('fr');
                      setShowLanguageMenu(false);
                    }}
                    aria-label={t('layout.language.fr')}
                  >
                    <span className="language-flag" aria-hidden="true">🇫🇷</span>
                  </button>
                  <button
                    type="button"
                    className={`language-option ${locale === 'ar' ? 'active' : ''}`}
                    onClick={() => {
                      setLocale('ar');
                      setShowLanguageMenu(false);
                    }}
                    aria-label={t('layout.language.ar')}
                  >
                    <span className="language-flag" aria-hidden="true">🇲🇦</span>
                  </button>
                </div>
              ) : null}
            </div>

            {user ? (
              <>
                <div className="notification-wrapper">
                  <button
                    className="icon-button"
                    onClick={() => setShowNotifications((open) => !open)}
                    aria-label={t('common.notifications')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
                  </button>

                  {showNotifications ? (
                    <div className="notification-dropdown">
                      <div className="notification-dropdown-header">
                        <h4>{t('common.notifications')}</h4>
                        <span>{t('layout.unread_count', { count: unreadCount })}</span>
                      </div>
                      <div className="notification-dropdown-body">
                        {notifications.length === 0 ? (
                          <p className="no-notifications">{t('layout.no_notifications')}</p>
                        ) : (
                          notifications.map((notification) => (
                            <div key={notification.id} className={`dropdown-notification-item ${notification.read_at ? 'read' : 'unread'}`}>
                              <div className="notif-content">
                                <strong>{notification.title}</strong>
                                <p>{notification.body}</p>
                              </div>
                              {!notification.read_at ? (
                                <button className="ghost-button-sm" onClick={() => markNotificationRead(notification.id)}>
                                  {t('layout.read')}
                                </button>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <NavLink to="/profile" className="user-pill">
                  <img src={buildAvatarUrl(user)} alt={user.name} className="avatar-sm" />
                  <div>
                    <span>{user.name}</span>
                    <small>
                      {formatRole(user.role, t)}
                      {user.city ? ` - ${user.city}` : ''}
                    </small>
                  </div>
                </NavLink>
                <button className="ghost-button" onClick={logout}>
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <NavLink to="/auth" className="primary-button">
                {t('common.login')}
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
