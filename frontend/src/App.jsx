import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HomePage from './pages/HomePage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AnnoncesPage from './pages/AnnoncesPage.jsx';
import AnnonceDetailsPage from './pages/AnnonceDetailsPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import { useLocalization } from './context/LocalizationContext.jsx';

function ProtectedRoute({ children }) {
  const { user, booting } = useAuth();
  const { t, ready } = useLocalization();

  if (booting || !ready) {
    return <div className="shell-loader">{t('common.loading')}</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, booting } = useAuth();
  const { t, ready } = useLocalization();

  if (booting || !ready) {
    return <div className="shell-loader">{t('common.loading')}</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function NonAdminRoute({ children }) {
  const { user, booting } = useAuth();
  const { t, ready } = useLocalization();

  if (booting || !ready) {
    return <div className="shell-loader">{t('common.loading')}</div>;
  }

  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function DashboardRoute() {
  const { user, booting } = useAuth();
  const { t, ready } = useLocalization();

  if (booting || !ready) {
    return <div className="shell-loader">{t('common.loading')}</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/search" element={
          <NonAdminRoute>
            <SearchPage />
          </NonAdminRoute>
        } />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route
          path="/dashboard"
          element={<DashboardRoute />}
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <NonAdminRoute>
                <InboxPage />
              </NonAdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/annonces"
          element={
            <ProtectedRoute>
              <AnnoncesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/annonces/:id"
          element={
            <AnnonceDetailsPage />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
      </Route>
    </Routes>
  );
}
