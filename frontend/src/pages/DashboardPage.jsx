import { useEffect, useState } from 'react';
import ArtisanCard from '../components/ArtisanCard.jsx';
import PostComposer from '../components/PostComposer.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl } from '../utils/userPresentation.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [artisans, setArtisans] = useState([]);
  const [status, setStatus] = useState('');

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
          setStatus(err.message);
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
      setStatus('Annonce publiee avec succes.');
      await load();
    } catch (err) {
      setStatus(err.message);
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
      setStatus(`Avis envoye a ${artisan.user.name}.`);
      await load();
    } catch (err) {
      setStatus(err.message);
    }
  };

  if (!dashboard) {
    return <div className="shell-loader">Chargement du dashboard...</div>;
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
        {status ? <div className="status-pill">{status}</div> : null}
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
              <div className="card-grid">
                {artisans.map((artisan) => (
                  <ArtisanCard key={artisan.id} artisan={artisan} onReview={leaveReview} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

