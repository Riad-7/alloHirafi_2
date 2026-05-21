import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read_at).length;

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

  const markNotificationRead = async (notificationId) => {
    try {
      await apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n));
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
            <strong>AloHirafi</strong>
            <p>Artisans et clients, enfin connectes pour de vrai.</p>
          </div>
        </NavLink>

        <nav className="main-nav">
          <NavLink to="/">Accueil</NavLink>
          {user?.role !== 'admin' && <NavLink to="/search">Recherche</NavLink>}
          <NavLink to={user?.role === 'admin' ? '/admin' : '/dashboard'}>Dashboard</NavLink>
          {user?.role !== 'admin' && (
            <NavLink to="/inbox" className="inbox-link">
              Inbox
            </NavLink>
          )}
          <NavLink to="/profile">Profil</NavLink>
        </nav>

        <div className="topbar-actions">
          {user ? (
            <>
              <div className="notification-wrapper">
                <button 
                  className="icon-button" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <h4>Notifications</h4>
                      <span>{unreadCount} non lues</span>
                    </div>
                    <div className="notification-dropdown-body">
                      {notifications.length === 0 ? (
                        <p className="no-notifications">Aucune notification</p>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className={`dropdown-notification-item ${notification.read_at ? 'read' : 'unread'}`}>
                            <div className="notif-content">
                              <strong>{notification.title}</strong>
                              <p>{notification.body}</p>
                            </div>
                            {!notification.read_at && (
                              <button className="ghost-button-sm" onClick={() => markNotificationRead(notification.id)}>
                                Lu
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
                    {formatRole(user.role)}
                    {user.city ? ` - ${user.city}` : ''}
                  </small>
                </div>
              </NavLink>
              <button className="ghost-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/auth" className="primary-button">
              Login
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

