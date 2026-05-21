import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import { buildAvatarUrl } from '../utils/userPresentation.js';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState({ total_users: 0, total_clients: 0, total_artisans: 0, pending_verifications: 0 });
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
      toast.error('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [toast, userRoleFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchData, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await apiRequest(`/admin/verifications/${id}/approve`, { method: 'POST' });
      toast.success('Vérification approuvée.');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) return toast.error('Veuillez fournir un motif de rejet.');
    
    setProcessingId(selectedRequest.id);
    try {
      await apiRequest(`/admin/verifications/${selectedRequest.id}/reject`, {
        method: 'POST',
        body: { note: rejectionNote },
      });
      toast.success('Vérification rejetée.');
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

  if (loading) return <div className="shell-loader">Chargement du dashboard...</div>;

  return (
    <div className="stack-layout admin-dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Tableau de bord</h1>
        </div>
      </header>

      <div className="stats-row">
        <StatCard
          label="Utilisateurs"
          value={stats.total_users}
        />
        <StatCard
          label="Clients"
          value={stats.total_clients}
        />
        <StatCard 
          label="Artisans inscrits" 
          value={stats.total_artisans} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
        />
        <StatCard 
          label="Vérifications en attente" 
          value={stats.pending_verifications} 
          color="accent"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
        />
      </div>

      <section className="panel requests-panel">
        <div className="panel-heading">
          <div>
            <h3>Utilisateurs</h3>
            <p>Clients, artisans et admins visibles seulement par l'administration.</p>
          </div>
          <div className="segmented">
            <button className={userRoleFilter === 'client' ? 'active' : ''} onClick={() => setUserRoleFilter('client')} type="button">
              Clients
            </button>
            <button className={userRoleFilter === 'artisan' ? 'active' : ''} onClick={() => setUserRoleFilter('artisan')} type="button">
              Artisans
            </button>
            <button className={userRoleFilter === 'admin' ? 'active' : ''} onClick={() => setUserRoleFilter('admin')} type="button">
              Admins
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Role</th>
                <th>Ville</th>
                <th>Telephone</th>
                <th>Date</th>
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
                  <td>{item.role}</td>
                  <td>{item.city || 'Non precisee'}</td>
                  <td>{item.phone || '-'}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel requests-panel">
        <div className="panel-heading">
          <h3>Demandes de vérification</h3>
          <p>Examinez les documents et validez les comptes artisans.</p>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="empty-state">
            <p>Aucune demande en attente.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Artisan</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Actions</th>
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
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="ghost-button-sm" onClick={() => viewDocument(req.id)}>
                          Voir Doc
                        </button>
                        <button 
                          className="primary-button-sm" 
                          onClick={() => handleApprove(req.id)}
                          disabled={processingId === req.id}
                        >
                          Approuver
                        </button>
                        <button 
                          className="danger-button-sm" 
                          onClick={() => openRejectionModal(req)}
                          disabled={processingId === req.id}
                        >
                          Rejeter
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
              <h3>Rejeter la demande</h3>
              <p>Expliquez à l'artisan pourquoi sa demande est refusée.</p>
            </div>
            <textarea 
              value={rejectionNote} 
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Ex: Document illisible, Nom ne correspond pas..."
              rows="4"
            />
            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setShowRejectionModal(false)}>Annuler</button>
              <button 
                className="primary-button danger" 
                onClick={handleReject}
                disabled={processingId !== null}
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
