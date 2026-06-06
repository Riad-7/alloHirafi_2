import { Link } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { buildAvatarUrl, buildMediaUrl } from '../utils/userPresentation.js';
import { buildRatingSummary, formatRatingValue } from '../utils/rating.js';

export default function ArtisanCard({ artisan, onContact, onReview }) {
  const { t } = useLocalization();
  const coverImage = buildMediaUrl(artisan.posts?.[0]?.images?.[0]?.image_url);
  const ratingSummary = buildRatingSummary(artisan, artisan.user?.name ?? '');

  return (
    <article className="artisan-card premium-card">
      {coverImage ? (
        <div className="artisan-cover">
          <img src={coverImage} alt={t('artisan.cover_alt', { name: artisan.user.name })} />
          <div className="artisan-status-badge">
            <span className={`status-dot ${artisan.is_available ? 'available' : 'busy'}`}></span>
            {artisan.is_available ? t('artisan.status_available') : t('artisan.status_busy')}
          </div>
        </div>
      ) : (
        <div className="artisan-cover empty-cover">
          <div className="artisan-status-badge">
            <span className={`status-dot ${artisan.is_available ? 'available' : 'busy'}`}></span>
            {artisan.is_available ? t('artisan.status_available') : t('artisan.status_busy')}
          </div>
        </div>
      )}

      <div className="artisan-card-content">
        <div className="artisan-card-top">
          <div className="artisan-identity">
            <Link to={`/users/${artisan.user.id}`} className="avatar-link" aria-label={t('artisan.view_profile', { name: artisan.user.name })}>
              <img src={buildAvatarUrl(artisan.user)} alt={artisan.user.name} className="avatar-md" />
            </Link>
            <div className="artisan-name-wrapper">
              <h3>{artisan.user.name}</h3>
              {artisan.is_verified ? (
                <svg className="verified-badge" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="9 11 12 14 15 9"></polyline></svg>
              ) : null}
            </div>
          </div>
          <div className="rating-badge">
            {ratingSummary.stars_visual}
            {ratingSummary.reviews_count > 0 ? ` (${formatRatingValue(ratingSummary.average_rating)}/5)` : ''}
          </div>
        </div>
        {ratingSummary.reviews_count === 0 ? (
          <p className="muted-copy" style={{ marginTop: '0.35rem', marginBottom: 0, fontSize: '0.82rem' }}>
            {ratingSummary.no_reviews_message}
          </p>
        ) : null}

        <p className="artisan-location">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          {artisan.user.city || t('common.morocco')}
        </p>

        <p className="muted-copy artisan-bio">{artisan.bio}</p>

        {artisan.match_score ? (
          <div className="ai-match-box">
            <strong>Match IA {artisan.match_score}%</strong>
            {artisan.match_reasons?.length ? (
              <span>{artisan.match_reasons.join(' · ')}</span>
            ) : null}
          </div>
        ) : null}

        <div className="artisan-meta">
          <div className="meta-item">
            <strong>{artisan.hourly_rate} DH</strong>
          </div>
          <div className="meta-separator"></div>
          <div className="meta-item">
            <strong>{artisan.years_experience} {t('artisan.years')}</strong>
            <span>{t('artisan.experience_suffix')}</span>
          </div>
        </div>

        <div className="card-actions">
          {onContact ? (
            <button className="primary-button" onClick={() => onContact(artisan)}>
              {t('common.contact')}
            </button>
          ) : null}
          {onReview ? (
            <button
              className="ghost-button"
              onClick={() => onReview(artisan)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M8 10h8"></path><path d="M8 14h5"></path></svg>
              {t('artisan.leave_review')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
