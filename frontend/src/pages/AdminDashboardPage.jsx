import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function AdminDashboardPage() {
  const { locale, t } = useLocalization();
  const toast = useToast();
  const [stats, setStats] = useState({
    total_users: 0,
    total_clients: 0,
    total_artisans: 0,
    pending_verifications: 0,
    requests_today: 0,
    errors_today: 0,
    error_rate_today: 0,
    errors_per_day: [],
    recent_errors: [],
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('client');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, requestsData, usersData] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/verifications/pending'),
        apiRequest(`/admin/users?role=${userRoleFilter}`),
      ]);
      setStats(statsData);
      setPendingRequests(requestsData);
      setUsers(usersData.users ?? []);
    } catch {
      toast.error(t('admin.load_error'));
    } finally {
      setLoading(false);
    }
  }, [t, toast, userRoleFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchData, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await apiRequest(`/admin/verifications/${id}/approve`, { method: 'POST' });
      toast.success(t('admin.approve_success'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) return toast.error(t('admin.rejection_reason_required'));

    setProcessingId(selectedRequest.id);
    try {
      await apiRequest(`/admin/verifications/${selectedRequest.id}/reject`, {
        method: 'POST',
        body: { note: rejectionNote },
      });
      toast.success(t('admin.reject_success'));
      setShowRejectionModal(false);
      setRejectionNote('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectionModal = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const viewDocument = (id) => {
    const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const API_URL = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000/api`;
    window.open(`${API_URL}/admin/verifications/${id}/document`, '_blank');
  };

  const errorSeries = stats.errors_per_day ?? [];
  const maxErrorCount = Math.max(...errorSeries.map((item) => item.count), 1);
  const recentErrors = stats.recent_errors ?? [];
  const formatExceptionName = (name) => name?.split('\\').pop() ?? '-';

  if (loading) return <div className="shell-loader">{t('admin.loading')}</div>;

  return (
    <div className="stack-layout admin-dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h1>{t('common.dashboard')}</h1>
        </div>
      </header>

      <div className="stats-row">
        <StatCard label={t('admin.stats.users')} value={stats.total_users} />
        <StatCard label={t('admin.stats.clients')} value={stats.total_clients} />
        <StatCard
          label={t('admin.stats.artisans')}
          value={stats.total_artisans}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
        />
        <StatCard
          label={t('admin.stats.pending_verifications')}
          value={stats.pending_verifications}
          color="accent"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
        />
        <StatCard label={t('admin.stats.requests_today')} value={stats.requests_today} />
        <StatCard
          label={t('admin.stats.errors_today')}
          value={stats.errors_today}
          color="danger"
        />
      </div>

      <section className="panel requests-panel">
        <div className="panel-heading">
          <div>
            <h3>{t('admin.observability_title')}</h3>
            <p>{t('admin.observability_body')}</p>
          </div>
          <div className="observability-pill">
            <strong>{stats.error_rate_today}%</strong>
            <span>{t('admin.error_rate_today')}</span>
          </div>
        </div>

        <div className="error-series">
          {errorSeries.map((item) => (
            <article key={item.date} className="error-series-item">
              <div className="error-series-header">
                <small>{item.label}</small>
                <strong>{item.count}</strong>
              </div>
              <div className="error-series-track">
                <div
                  className="error-series-bar"
                  style={{ width: `${Math.max((item.count / maxErrorCount) * 100, item.count > 0 ? 8 : 0)}%` }}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.error_date')}</th>
                <th>{t('admin.error_type')}</th>
                <th>{t('admin.error_endpoint')}</th>
                <th>{t('admin.error_message')}</th>
              </tr>
            </thead>
            <tbody>
              {recentErrors.length === 0 ? (
                <tr>
                  <td colSpan="4">{t('admin.no_errors')}</td>
                </tr>
              ) : (
                recentErrors.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-MA')}</td>
                    <td>{formatExceptionName(item.exception_class)}</td>
                    <td>{`${item.method ?? '-'} ${item.path ?? '-'}`}</td>
                    <td>{item.message || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel requests-panel">
        <div className="panel-heading">
          <div>
            <h3>{t('admin.users_title')}</h3>
            <p>{t('admin.users_body')}</p>
          </div>
          <div className="segmented">
            <button className={userRoleFilter === 'client' ? 'active' : ''} onClick={() => setUserRoleFilter('client')} type="button">
              {t('common.role.client')}
            </button>
            <button className={userRoleFilter === 'artisan' ? 'active' : ''} onClick={() => setUserRoleFilter('artisan')} type="button">
              {t('common.role.artisan')}
            </button>
            <button className={userRoleFilter === 'admin' ? 'active' : ''} onClick={() => setUserRoleFilter('admin')} type="button">
              {t('common.role.admin')}
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.table_user')}</th>
                <th>{t('auth.role')}</th>
                <th>{t('auth.city')}</th>
                <th>{t('auth.phone')}</th>
                <th>{t('admin.table_date')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/users/${item.id}`} className="artisan-cell">
                      <img src={buildAvatarUrl(item)} alt="" className="avatar-xs" />
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.email}</small>
                      </div>
                    </Link>
                  </td>
                  <td>{formatRole(item.role, t)}</td>
                  <td>{item.city || t('common.not_specified')}</td>
                  <td>{item.phone || '-'}</td>
                  <td>{new Date(item.created_at).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-MA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel requests-panel">
        <div className="panel-heading">
          <h3>{t('admin.verifications_title')}</h3>
          <p>{t('admin.verifications_body')}</p>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="empty-state">
            <p>{t('admin.no_pending')}</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.table_artisan')}</th>
                  <th>{t('admin.table_type')}</th>
                  <th>{t('admin.table_date')}</th>
                  <th>{t('admin.table_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <Link to={`/users/${req.user.id}`} className="artisan-cell">
                        <img src={buildAvatarUrl(req.user)} alt="" className="avatar-xs" />
                        <div>
                          <strong>{req.user.name}</strong>
                          <small>{req.user.email}</small>
                        </div>
                      </Link>
                    </td>
                    <td>{req.document_type.toUpperCase()}</td>
                    <td>{new Date(req.created_at).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-MA')}</td>
                    <td>
                      <div className="table-actions">
                        <button className="ghost-button-sm" onClick={() => viewDocument(req.id)}>
                          {t('admin.view_doc')}
                        </button>
                        <button
                          className="primary-button-sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id}
                        >
                          {t('admin.approve')}
                        </button>
                        <button
                          className="danger-button-sm"
                          onClick={() => openRejectionModal(req)}
                          disabled={processingId === req.id}
                        >
                          {t('admin.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="panel modal-content">
            <div className="panel-heading">
              <h3>{t('admin.reject_modal_title')}</h3>
              <p>{t('admin.reject_modal_body')}</p>
            </div>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder={t('admin.reject_placeholder')}
              rows="4"
            />
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setShowRejectionModal(false)}>{t('common.cancel')}</button>
              <button
                className="primary-button danger"
                onClick={handleReject}
                disabled={processingId !== null}
              >
                {t('admin.confirm_reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
