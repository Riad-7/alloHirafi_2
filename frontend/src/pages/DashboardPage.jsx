import { useEffect, useState } from 'react';
import ArtisanCard from '../components/ArtisanCard.jsx';
import PostComposer from '../components/PostComposer.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
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
  }, []);

  const publishPost = async (payload) => {
    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: payload,
      });
      toast.success('Annonce publiee avec succes.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la publication');
    }
  };



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
        <StatCard label="Artisans" value={dashboard.stats.artisans} helper="Disponible dans le reseau" />
        <StatCard label="Annonces" value={dashboard.stats.posts} helper="Offres visibles" />
        <StatCard label="Conversations" value={dashboard.stats.conversations} helper="Echanges actifs" />
        <StatCard label="Devis" value={dashboard.stats.quotes} helper="Suivi commercial" />
      </div>

      <div className="content-grid">
        <div className="stack-layout full-width">
          {user?.role === 'artisan' ? <PostComposer onSubmit={publishPost} /> : null}

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

