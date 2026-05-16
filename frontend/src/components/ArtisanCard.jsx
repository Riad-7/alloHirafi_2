export default function ArtisanCard({ artisan, onContact, onReview }) {
  return (
    <article className="artisan-card">
      <div className="artisan-card-top">
        <div>
          <p className="eyebrow">{artisan.user.city || 'Maroc'}</p>
          <h3>{artisan.user.name}</h3>
          <p>{artisan.craft}</p>
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
