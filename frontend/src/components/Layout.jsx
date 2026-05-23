import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocalization();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const languageMenuRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const loadNotifications = async () => {
      if (!user) {
        if (!cancelled) {
          setNotifications([]);
        }
        return;
      }

      try {
        const data = await apiRequest('/notifications');

        if (!cancelled) {
          setNotifications(data.notifications || []);
        }
      } catch {
        if (!cancelled) {
          setNotifications([]);
        }
      }
    };

    loadNotifications();

    if (user) {
      intervalId = window.setInterval(loadNotifications, 30000);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [user]);

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
      await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications(
        notifications.map((notification) => (
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )),
      );
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

        <nav className="main-nav">
          <NavLink to="/">{t('common.home')}</NavLink>
          {user?.role !== 'admin' && <NavLink to="/search">{t('common.search')}</NavLink>}
          {user?.role === 'artisan' && <NavLink to="/annonces">{t('common.ads')}</NavLink>}
          {user && (
            <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'}>{t('common.dashboard')}</NavLink>
          )}
          {user?.role !== 'admin' && user && (
            <NavLink to="/inbox" className="inbox-link">
              {t('common.inbox')}
            </NavLink>
          )}
          {user && <NavLink to="/profile">{t('common.profile')}</NavLink>}
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
              <span className="language-flag" aria-hidden="true">{locale === 'ar' ? '🇲🇦' : '🇫🇷'}</span>
            </button>

            {showLanguageMenu && (
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
            )}
          </div>

          {user ? (
            <>
              <div className="notification-wrapper">
                <button
                  className="icon-button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label={t('common.notifications')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                  {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
                </button>

                {showNotifications && (
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
                            {!notification.read_at && (
                              <button className="ghost-button-sm" onClick={() => markNotificationRead(notification.id)}>
                                {t('layout.read')}
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
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
      </header>

      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
