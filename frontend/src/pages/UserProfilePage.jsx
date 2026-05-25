import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, buildMediaUrl, formatRole } from '../utils/userPresentation.js';
import { buildRatingSummary, formatRatingValue } from '../utils/rating.js';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, t } = useLocalization();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const data = await apiRequest(`/users/${id}`);

        if (!cancelled) {
          setProfile(data.profile);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message || t('public_profile.not_found'));
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [id, t, toast]);

  const contactProfile = async () => {
    if (!user) {
      toast.error(t('public_profile.login_required'));
      return;
    }

    if (!profile || profile.role !== 'artisan') {
      toast.error(t('public_profile.artisan_only'));
      return;
    }

    setBusy(true);
    try {
      await apiRequest('/conversations', {
        method: 'POST',
        body: {
          artisan_id: profile.id,
          message: t('public_profile.contact_message', { name: profile.name }),
        },
      });
      toast.success(t('public_profile.contact_success', { name: profile.name }));
      navigate('/inbox');
    } catch (err) {
      toast.error(err.message || t('public_profile.contact_error'));
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return <div className="shell-loader">{t('public_profile.loading')}</div>;
  }

  const artisan = profile.artisan_profile;
  const posts = profile.posts ?? [];
  const ratingSummary = artisan ? buildRatingSummary(artisan, profile.name) : null;

  return (
    <section className="stack-layout public-profile-page">
      <div className="public-profile-hero">
        <img src={buildAvatarUrl(profile)} alt={profile.name} className="avatar-lg" />
        <div>
          <p className="eyebrow">{formatRole(profile.role, t)}</p>
          <h1>{profile.name}</h1>
          <p className="muted-copy">{profile.city || t('common.morocco')}</p>
        </div>
        {profile.role === 'artisan' && user?.id !== profile.id ? (
          <button className="primary-button" onClick={contactProfile} disabled={busy}>
            {busy ? t('public_profile.opening') : t('common.contact')}
          </button>
        ) : null}
      </div>

      {artisan ? (
        <div className="profile-summary-grid">
          <article className="stat-card">
            <span>{t('auth.craft')}</span>
            <strong>{artisan.craft}</strong>
          </article>
          <article className="stat-card">
            <span>{t('public_profile.rate')}</span>
            <strong>{artisan.hourly_rate} DH</strong>
          </article>
          <article className="stat-card">
            <span>{t('public_profile.experience')}</span>
            <strong>{artisan.years_experience} {t('artisan.years')}</strong>
          </article>
          <article className="stat-card">
            <span>{t('dashboard.stats.average_rating')}</span>
            <strong>
              {ratingSummary?.reviews_count > 0
                ? `${ratingSummary.stars_visual} (${formatRatingValue(ratingSummary.average_rating)}/5)`
                : ratingSummary?.no_reviews_message}
            </strong>
          </article>
        </div>
      ) : null}

      {artisan?.bio ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>{t('public_profile.about')}</h3>
          </div>
          <p className="muted-copy">{artisan.bio}</p>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>{t('common.ads')}</h3>
            <p>{t('public_profile.posts_by', { name: profile.name })}</p>
          </div>
          <div className="profile-posts-list">
            {posts.map((post) => (
              <article key={post.id} className="profile-post-card">
                <div className="profile-post-media">
                  {post.images?.[0]?.image_url ? (
                    <img src={buildMediaUrl(post.images[0].image_url)} alt={post.title} />
                  ) : (
                    <div className="profile-post-placeholder">
                      <span>{t('common.image')}</span>
                    </div>
                  )}
                  <span className="profile-post-city">{post.city}</span>
                </div>
                <div className="profile-post-content">
                  <div>
                    <h3>{post.title}</h3>
                    <p>{post.description}</p>
                  </div>
                  <div className="profile-post-footer">
                    <strong>{post.price_from || post.price_to ? `${post.price_from ?? '0'} - ${post.price_to ?? post.price_from} DH` : t('common.price_on_quote')}</strong>
                    <span>{post.available_at ? formatDateTime(post.available_at, locale) : t('common.available')}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <Link to="/search" className="ghost-button public-profile-back">
        {t('public_profile.back_to_search')}
      </Link>
    </section>
  );
}
