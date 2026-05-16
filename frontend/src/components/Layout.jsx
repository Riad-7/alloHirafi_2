import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

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
          <NavLink to="/inbox">Inbox</NavLink>
        </nav>

        <div className="topbar-actions">
          {user ? (
            <>
              <div className="user-pill">
                <span>{user.name}</span>
                <small>{user.role}</small>
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
