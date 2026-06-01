import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArtisanCard from '../components/ArtisanCard.jsx';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocalization();
  const toast = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [artisans, setArtisans] = useState([]);
  const [reviewDraft, setReviewDraft] = useState({
    artisanId: null,
    rating: 0,
    comment: '',
    submitting: false,
  });

  const load = async () => {
    const dashboardData = await apiRequest('/dashboard');
    const artisansData = dashboardData.user.role === 'client'
      ? await apiRequest('/artisans?disponible=1')
      : { artisans: [] };

    setDashboard(dashboardData);
    setArtisans(artisansData.artisans);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const dashboardData = await apiRequest('/dashboard');
        const artisansData = dashboardData.user.role === 'client'
          ? await apiRequest('/artisans?disponible=1')
          : { artisans: [] };

        if (!cancelled) {
          setDashboard(dashboardData);
          setArtisans(artisansData.artisans);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message || t('dashboard.load_error'));
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  const selectedArtisan = artisans.find((artisan) => artisan.id === reviewDraft.artisanId) ?? null;
  const openReviewComposer = (artisan) => {
    setReviewDraft({
      artisanId: artisan.id,
      rating: 5,
      comment: '',
      submitting: false,
    });
  };

  const closeReviewComposer = () => {
    setReviewDraft({
      artisanId: null,
      rating: 0,
      comment: '',
      submitting: false,
    });
  };

  const submitReview = async () => {
    if (!selectedArtisan) return;

    if (reviewDraft.rating < 1 || reviewDraft.rating > 5) {
      toast.error('Choisis une note entre 1 et 5 etoiles.');
      return;
    }

    setReviewDraft((current) => ({ ...current, submitting: true }));

    try {
      await apiRequest(`/artisans/${selectedArtisan.id}/reviews`, {
        method: 'POST',
        body: {
          rating: reviewDraft.rating,
          comment: reviewDraft.comment || null,
        },
      });

      toast.success(t('dashboard.review_success', { name: selectedArtisan.user.name }));
      closeReviewComposer();
      await load();
    } catch (err) {
      toast.error(err.message || t('dashboard.review_error'));
      setReviewDraft((current) => ({ ...current, submitting: false }));
    }
  };

  if (!dashboard) {
    return (
      <div className="shell-loader">
        <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
        <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>{t('dashboard.loading_space')}</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <section className="stack-layout">
      <div className="panel dashboard-hero">
        <div>
          <p className="eyebrow">{t('common.dashboard')}</p>
          <h2>{t('dashboard.welcome', { name: dashboard.user.name })}</h2>
          <p className="muted-copy">
            {t('dashboard.role_city', {
              role: formatRole(dashboard.user.role, t),
              city: dashboard.user.city || t('common.not_specified'),
            })}
          </p>
        </div>
        <img src={buildAvatarUrl(dashboard.user)} alt={dashboard.user.name} className="avatar-lg" />
      </div>

      <div className="stats-row">
        {user?.role === 'client' && (
          <>
            <StatCard
              label={t('dashboard.stats.conversations')}
              value={dashboard.stats.conversations}
              helper={t('dashboard.stats.active_exchanges')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
            />
            <StatCard
              label={t('dashboard.stats.received_quotes')}
              value={dashboard.stats.quotes}
              helper={t('dashboard.stats.quotes_received_followup')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
          </>
        )}

        {user?.role === 'artisan' && (
          <>
            <StatCard
              label={t('dashboard.stats.my_posts')}
              value={dashboard.stats.posts}
              helper={t('dashboard.stats.published_services')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
            />
            <StatCard
              label={t('dashboard.stats.conversations')}
              value={dashboard.stats.conversations}
              helper={t('dashboard.stats.client_exchanges')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
            />
            <StatCard
              label={t('dashboard.stats.sent_quotes')}
              value={dashboard.stats.quotes}
              helper={t('dashboard.stats.sent_offers')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
            <StatCard
              label={t('dashboard.stats.average_rating')}
              value={`${dashboard.stats.rating || '0.0'} \u2605`}
              helper={t('dashboard.stats.reviews_count', { count: dashboard.stats.reviews_count || 0 })}
              color="accent"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
            />
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <StatCard
              label={t('dashboard.stats.artisans')}
              value={dashboard.stats.artisans}
              helper={t('dashboard.stats.network_available')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
            />
            <StatCard
              label={t('common.ads')}
              value={dashboard.stats.posts}
              helper={t('dashboard.stats.visible_offers')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
            />
            <StatCard
              label={t('dashboard.stats.conversations')}
              value={dashboard.stats.conversations}
              helper={t('dashboard.stats.active_exchanges')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
            />
            <StatCard
              label={t('dashboard.stats.quotes')}
              value={dashboard.stats.quotes}
              helper={t('dashboard.stats.business_followup')}
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            />
          </>
        )}
      </div>

      {user?.role === 'client' ? (
        <div className="dashboard-client-main">
          <div className="panel">
            <div className="panel-heading">
              <h3>{t('dashboard.client_reviews_title')}</h3>
              <p>{t('dashboard.client_reviews_body')}</p>
            </div>

            {selectedArtisan ? (
              <div className="review-composer">
                <div className="review-composer-header">
                  <div className="review-selected-artisan">
                    <img src={buildAvatarUrl(selectedArtisan.user)} alt={selectedArtisan.user.name} className="avatar-sm" />
                    <div>
                      <strong>Ton avis pour {selectedArtisan.user.name}</strong>
                      <small className="muted-copy">Choisis une note et ecris un commentaire clair.</small>
                    </div>
                  </div>
                  <button className="ghost-button" onClick={closeReviewComposer}>
                    {t('common.cancel')}
                  </button>
                </div>

                <div>
                  <label className="review-label">Note</label>
                  <div className="review-stars" role="radiogroup" aria-label="Choisir une note">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`review-star-btn ${value <= reviewDraft.rating ? 'active' : ''}`}
                        onClick={() => setReviewDraft((current) => ({ ...current, rating: value }))}
                        aria-checked={value === reviewDraft.rating}
                        role="radio"
                        title={`${value}/5`}
                      >
                        {'\u2605'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment" className="review-label">Commentaire</label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    placeholder="Ex: Service rapide, propre et tres professionnel."
                    value={reviewDraft.comment}
                    onChange={(event) => setReviewDraft((current) => ({ ...current, comment: event.target.value }))}
                  />
                </div>

                <div className="review-composer-actions">
                  <button className="ghost-button" onClick={closeReviewComposer} disabled={reviewDraft.submitting}>
                    {t('common.cancel')}
                  </button>
                  <button className="primary-button" onClick={submitReview} disabled={reviewDraft.submitting}>
                    {reviewDraft.submitting ? 'Envoi...' : 'Envoyer l avis'}
                  </button>
                </div>
              </div>
            ) : null}

            {artisans.length > 0 ? (
              <div className="card-grid">
                {artisans.map((artisan) => (
                  <ArtisanCard key={artisan.id} artisan={artisan} onReview={openReviewComposer} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                <h4>{t('dashboard.no_artisans_title')}</h4>
                <p>{t('dashboard.no_artisans_body')}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {user?.role === 'artisan' ? (
        <div className="panel dashboard-artisan-actions">
          <div className="panel-heading">
            <h3>{t('dashboard.artisan_actions_title')}</h3>
            <p>{t('dashboard.artisan_actions_body')}</p>
          </div>

          <div className="dashboard-action-grid">
            <Link to="/annonces" className="dashboard-action-card">
              <strong>{t('dashboard.actions.manage_posts')}</strong>
              <span>{t('dashboard.actions.manage_posts_body')}</span>
            </Link>
            <Link to="/inbox" className="dashboard-action-card">
              <strong>{t('dashboard.actions.open_conversations')}</strong>
              <span>{t('dashboard.actions.open_conversations_body')}</span>
            </Link>
            <Link to="/profile" className="dashboard-action-card">
              <strong>{t('dashboard.actions.update_profile')}</strong>
              <span>{t('dashboard.actions.update_profile_body')}</span>
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
