import { useEffect, useState } from 'react';
import ArtisanCard from '../components/ArtisanCard.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl } from '../utils/userPresentation.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [artisans, setArtisans] = useState([]);

  const load = async () => {
    const [dashboardData, artisansData] = await Promise.all([
      apiRequest('/dashboard'),
      apiRequest('/artisans'),
    ]);

    setDashboard(dashboardData);
    setArtisans(artisansData.artisans);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [dashboardData, artisansData] = await Promise.all([
          apiRequest('/dashboard'),
          apiRequest('/artisans'),
        ]);

        if (!cancelled) {
          setDashboard(dashboardData);
          setArtisans(artisansData.artisans);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message || 'Erreur lors du chargement du dashboard');
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const leaveReview = async (artisan) => {
    try {
      await apiRequest(`/artisans/${artisan.id}/reviews`, {
        method: 'POST',
        body: {
          rating: 5,
          comment: 'Avis envoye depuis le dashboard pour tester le flux humain.',
        },
      });
      toast.success(`Avis envoye a ${artisan.user.name}.`);
      await load();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi de l\'avis');
    }
  };

  if (!dashboard) {
    return (
      <div className="shell-loader">
        <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Chargement de ton espace...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <section className="stack-layout">
      <div className="panel dashboard-hero">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <h2>Bienvenue {dashboard.user.name}</h2>
          <p className="muted-copy">
            Role: {dashboard.user.role} - Ville: {dashboard.user.city || 'Non precisee'}
          </p>
        </div>
        <img src={buildAvatarUrl(dashboard.user)} alt={dashboard.user.name} className="avatar-lg" />
      </div>

      <div className="stats-row">
        {user?.role === 'client' && (
          <>
            <StatCard
              label="Conversations"
              value={dashboard.stats.conversations}
              helper="Échanges actifs"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
            />
            <StatCard
              label="Mes Devis"
              value={dashboard.stats.quotes}
              helper="Suivi commercial"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
          </>
        )}

        {user?.role === 'artisan' && (
          <>
            <StatCard
              label="Mes Annonces"
              value={dashboard.stats.posts}
              helper="Services publiés"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
            />
            <StatCard
              label="Conversations"
              value={dashboard.stats.conversations}
              helper="Échanges clients"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
            />
            <StatCard
              label="Mes Devis"
              value={dashboard.stats.quotes}
              helper="Offres envoyées"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
            <StatCard
              label="Note Moyenne"
              value={`${dashboard.stats.rating || '0.0'} ★`}
              helper={`${dashboard.stats.reviews_count || 0} avis reçu(s)`}
              color="accent"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
            />
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <StatCard
              label="Artisans"
              value={dashboard.stats.artisans}
              helper="Disponible dans le réseau"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
            />
            <StatCard
              label="Annonces"
              value={dashboard.stats.posts}
              helper="Offres visibles"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
            />
            <StatCard
              label="Conversations"
              value={dashboard.stats.conversations}
              helper="Échanges actifs"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
            />
            <StatCard
              label="Devis"
              value={dashboard.stats.quotes}
              helper="Suivi commercial"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
          </>
        )}
      </div>

      <div className="content-grid">
        <div className="stack-layout full-width">
          {user?.role === 'client' ? (
            <div className="panel">
              <div className="panel-heading">
                <h3>Donner de la confiance aux artisans</h3>
                <p>Laisse un avis rapide pour valider le flux review.</p>
              </div>
              {artisans.length > 0 ? (
                <div className="card-grid">
                  {artisans.map((artisan) => (
                    <ArtisanCard key={artisan.id} artisan={artisan} onReview={leaveReview} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                  <h4>Aucun artisan trouve</h4>
                  <p>Il semblerait qu'aucun artisan ne soit disponible pour le moment.</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

