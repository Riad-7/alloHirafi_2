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

/* ─── SVG Icon Components ─── */
const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconMegaphone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
);
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const IconInbox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
);
const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const IconLogin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
);

/* ─── Flag SVG Components ─── */
const FlagFR = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" className="nav-flag-icon">
    <rect width="7" height="14" x="0" fill="#002395" rx="1.5" ry="1.5"/>
    <rect width="6" height="14" x="7" fill="#FFFFFF"/>
    <rect width="7" height="14" x="13" fill="#ED2939" rx="1.5" ry="1.5"/>
  </svg>
);
const FlagAR = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" className="nav-flag-icon">
    <rect width="20" height="14" fill="#006233" rx="1.5" ry="1.5"/>
    <circle cx="11" cy="7" r="3.5" fill="#FFFFFF"/>
    <circle cx="12" cy="7" r="2.8" fill="#006233"/>
    <polygon points="9.5,5 10.2,7 8.5,5.8 10.5,5.8 8.8,7" fill="#D21034" transform="translate(0.2, 0)"/>
  </svg>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocalization();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const languageMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const currentLanguageLabel = useMemo(() => (locale === 'ar' ? 'العربية' : 'Français'), [locale]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowNotifications(false);
    setShowLanguageMenu(false);
    setShowUserMenu(false);
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
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
      <header className="topbar" id="main-navbar">
        {/* ─── Brand / Logo ─── */}
        <NavLink to="/" className="brand" id="brand-link">
          <img src="/image.png" alt="AlloHirafi" className="brand-logo" />
          <div className="brand-text">
            <strong>{t('app.name')}</strong>
            <p>{t('app.tagline')}</p>
          </div>
        </NavLink>

        {/* ─── Mobile Toggle ─── */}
        <button
          type="button"
          className="topbar-toggle"
          aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
          aria-expanded={showMobileMenu}
          onClick={() => setShowMobileMenu((open) => !open)}
          id="mobile-menu-toggle"
        >
          {showMobileMenu ? <IconClose /> : <IconMenu />}
        </button>

        {/* ─── Nav Panel ─── */}
        <div className={`topbar-panel ${showMobileMenu ? 'open' : ''}`}>
          <nav className="main-nav" id="main-navigation">
            <NavLink to="/" className="nav-link" id="nav-home">
              <IconHome />
              <span>{t('common.home')}</span>
            </NavLink>
            {user?.role !== 'admin' && (
              <NavLink to="/search" className="nav-link" id="nav-search">
                <IconSearch />
                <span>{t('common.search')}</span>
              </NavLink>
            )}
            {user?.role === 'artisan' && (
              <NavLink to="/annonces" className="nav-link" id="nav-ads">
                <IconMegaphone />
                <span>{t('common.ads')}</span>
              </NavLink>
            )}
            {user ? (
              <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-link" id="nav-dashboard">
                <IconDashboard />
                <span>{t('common.dashboard')}</span>
              </NavLink>
            ) : null}
            {user && user.role !== 'admin' ? (
              <NavLink to="/inbox" className="nav-link" id="nav-inbox">
                <IconInbox />
                <span>{t('common.inbox')}</span>
              </NavLink>
            ) : null}
          </nav>

          {/* ─── Right Actions ─── */}
          <div className="topbar-actions">
            {/* Language Switcher */}
            <div className="language-switcher" ref={languageMenuRef} id="language-switcher">
              <button
                type="button"
                className="lang-trigger"
                aria-label={t('layout.language')}
                aria-expanded={showLanguageMenu}
                onClick={() => setShowLanguageMenu((open) => !open)}
              >
                {locale === 'ar' ? <FlagAR /> : <FlagFR />}
                <span className="lang-trigger-label">{currentLanguageLabel}</span>
                <IconChevronDown />
              </button>

              {showLanguageMenu ? (
                <div className="lang-dropdown" role="listbox" aria-label={t('layout.language')}>
                  <button
                    type="button"
                    className={`lang-option ${locale === 'fr' ? 'active' : ''}`}
                    onClick={() => {
                      setLocale('fr');
                      setShowLanguageMenu(false);
                    }}
                    aria-label={t('layout.language.fr')}
                    id="lang-fr"
                  >
                    <FlagFR />
                    <span>Français</span>
                  </button>
                  <button
                    type="button"
                    className={`lang-option ${locale === 'ar' ? 'active' : ''}`}
                    onClick={() => {
                      setLocale('ar');
                      setShowLanguageMenu(false);
                    }}
                    aria-label={t('layout.language.ar')}
                    id="lang-ar"
                  >
                    <FlagAR />
                    <span>العربية</span>
                  </button>
                </div>
              ) : null}
            </div>

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="notification-wrapper" ref={notifRef} id="notification-center">
                  <button
                    className="nav-icon-btn"
                    onClick={() => setShowNotifications((open) => !open)}
                    aria-label={t('common.notifications')}
                    id="notification-bell"
                  >
                    <IconBell />
                    {unreadCount > 0 ? <span className="notif-dot">{unreadCount}</span> : null}
                  </button>

                  {showNotifications ? (
                    <div className="notification-dropdown">
                      <div className="notification-dropdown-header">
                        <h4>{t('common.notifications')}</h4>
                        <span className="notif-count-pill">{t('layout.unread_count', { count: unreadCount })}</span>
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

                {/* User Menu */}
                <div className="user-menu-wrapper" ref={userMenuRef} id="user-menu">
                  <button
                    className="user-trigger"
                    onClick={() => setShowUserMenu((open) => !open)}
                    aria-expanded={showUserMenu}
                  >
                    <img src={buildAvatarUrl(user)} alt={user.name} className="user-trigger-avatar" />
                    <div className="user-trigger-info">
                      <span className="user-trigger-name">{user.name}</span>
                      <small className="user-trigger-role">
                        {formatRole(user.role, t)}
                        {user.city ? ` · ${user.city}` : ''}
                      </small>
                    </div>
                    <IconChevronDown />
                  </button>

                  {showUserMenu ? (
                    <div className="user-dropdown">
                      <div className="user-dropdown-header">
                        <img src={buildAvatarUrl(user)} alt={user.name} className="user-dropdown-avatar" />
                        <div>
                          <strong>{user.name}</strong>
                          <small>{formatRole(user.role, t)}{user.city ? ` · ${user.city}` : ''}</small>
                        </div>
                      </div>
                      <div className="user-dropdown-divider" />
                      <NavLink to="/profile" className="user-dropdown-item" id="user-menu-profile">
                        <IconProfile />
                        <span>{t('common.profile')}</span>
                      </NavLink>
                      <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} className="user-dropdown-item" id="user-menu-dashboard">
                        <IconDashboard />
                        <span>{t('common.dashboard')}</span>
                      </NavLink>
                      <div className="user-dropdown-divider" />
                      <button className="user-dropdown-item logout-item" onClick={logout} id="user-menu-logout">
                        <IconLogout />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <NavLink to="/auth" className="login-btn" id="nav-login">
                <IconLogin />
                <span>{t('common.login')}</span>
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
