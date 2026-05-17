import { buildAvatarUrl } from '../utils/userPresentation.js';

export default function ArtisanCard({ artisan, onContact, onReview }) {
  const coverImage = artisan.posts?.[0]?.images?.[0]?.image_url;

  return (
    <article className="artisan-card">
      {coverImage ? (
        <div className="artisan-cover">
          <img src={coverImage} alt={`Intervention de ${artisan.user.name}`} />
        </div>
      ) : null}

      <div className="artisan-card-top">
        <div className="artisan-identity">
          <img src={buildAvatarUrl(artisan.user)} alt={artisan.user.name} className="avatar-md" />
          <div>
            <p className="eyebrow">{artisan.user.city || 'Maroc'}</p>
            <h3>{artisan.user.name}</h3>
            <p>{artisan.craft}</p>
          </div>
        </div>
        <div className="rating-badge">{artisan.average_rating}/5</div>
      </div>

      <p className="muted-copy">{artisan.bio}</p>

      <div className="artisan-meta">
        <span>{artisan.hourly_rate} DH/h</span>
        <span>{artisan.years_experience} ans d'experience</span>
        <span>{artisan.is_available ? 'Disponible' : 'Occupe'}</span>
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
    </article>
  );
}
