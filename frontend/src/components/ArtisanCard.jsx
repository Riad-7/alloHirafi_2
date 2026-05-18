import { buildAvatarUrl } from '../utils/userPresentation.js';

export default function ArtisanCard({ artisan, onContact, onReview }) {
  const coverImage = artisan.posts?.[0]?.images?.[0]?.image_url;

  return (
    <article className="artisan-card premium-card">
      {coverImage ? (
        <div className="artisan-cover">
          <img src={coverImage} alt={`Intervention de ${artisan.user.name}`} />
          <div className="artisan-status-badge">
            <span className={`status-dot ${artisan.is_available ? 'available' : 'busy'}`}></span>
            {artisan.is_available ? 'Disponible' : 'Occupe'}
          </div>
        </div>
      ) : (
        <div className="artisan-cover empty-cover">
          <div className="artisan-status-badge">
            <span className={`status-dot ${artisan.is_available ? 'available' : 'busy'}`}></span>
            {artisan.is_available ? 'Disponible' : 'Occupe'}
          </div>
        </div>
      )}

      <div className="artisan-card-content">
        <div className="artisan-card-top">
          <div className="artisan-identity">
            <img src={buildAvatarUrl(artisan.user)} alt={artisan.user.name} className="avatar-md" />
            <div className="artisan-name-wrapper">
              <h3>{artisan.user.name}</h3>
              {artisan.is_verified ? (
                <svg className="verified-badge" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="9 11 12 14 15 9"></polyline></svg>
              ) : null}
            </div>
          </div>
          <div className="rating-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            {artisan.average_rating}
          </div>
        </div>

        <p className="artisan-location">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          {artisan.user.city || 'Maroc'}
        </p>

        <p className="muted-copy artisan-bio">{artisan.bio}</p>

        <div className="artisan-meta">
          <div className="meta-item">
            <strong>{artisan.hourly_rate} DH</strong>
            <span>/heure</span>
          </div>
          <div className="meta-separator"></div>
          <div className="meta-item">
            <strong>{artisan.years_experience} ans</strong>
            <span>d'exp.</span>
          </div>
        </div>

        <div className="card-actions">
          {onContact ? (
            <button className="primary-button" onClick={() => onContact(artisan)}>
              Contacter
            </button>
          ) : null}
          {onReview ? (
            <button className="ghost-button" onClick={() => onReview(artisan)}>
              Laisser un avis
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
