import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const loadNotifications = async () => {
      if (!user) {
        if (!cancelled) {
          setUnreadNotifications(0);
        }
        return;
      }

      try {
        const data = await apiRequest('/notifications');

        if (!cancelled) {
          setUnreadNotifications(data.unread_count ?? 0);
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0);
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
          <NavLink to="/search">Recherche</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/inbox" className="inbox-link">
            Inbox
            {unreadNotifications > 0 ? <span className="notification-badge">{unreadNotifications}</span> : null}
          </NavLink>
          <NavLink to="/profile">Profil</NavLink>
        </nav>

        <div className="topbar-actions">
          {user ? (
            <>
              <div className="user-pill">
                <img src={buildAvatarUrl(user)} alt={user.name} className="avatar-sm" />
                <div>
                  <span>{user.name}</span>
                  <small>
                    {formatRole(user.role)}
                    {user.city ? ` - ${user.city}` : ''}
                  </small>
                </div>
              </div>
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

