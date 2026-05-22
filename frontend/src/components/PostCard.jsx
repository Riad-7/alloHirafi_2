import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { formatDateTime } from '../utils/date.js';
import { buildMediaUrl } from '../utils/userPresentation.js';

export default function PostCard({ post, onEdit, onDelete, showArtisan = false }) {
  const navigate = useNavigate();
  const { locale, t } = useLocalization();
  const cover = buildMediaUrl(post.images?.[0]?.image_url);
  const priceLabel =
    post.price_from || post.price_to
      ? `${post.price_from ?? '0'} - ${post.price_to ?? post.price_from} DH`
      : t('common.price_on_quote');

  return (
    <article 
      className="profile-post-card" 
      onClick={() => navigate(`/annonces/${post.id}`)}
      style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      <div className="profile-post-media">
        {cover ? (
          <img src={cover} alt={post.title} />
        ) : (
          <div className="profile-post-placeholder">
            <span>{t('common.image')}</span>
          </div>
        )}
        <span className="profile-post-city">{post.city}</span>
      </div>

      <div className="profile-post-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3>{post.title}</h3>
            {(onEdit || onDelete) && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {onEdit && (
                  <button 
                    className="icon-button" 
                    onClick={(e) => { e.stopPropagation(); onEdit(post); }}
                    title={t('common.edit')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                )}
                {onDelete && (
                  <button 
                    className="icon-button" 
                    style={{ color: 'var(--red-500)' }} 
                    onClick={(e) => { e.stopPropagation(); onDelete(post); }}
                    title={t('common.delete')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <p>{post.description}</p>
        </div>
        
        <div className="profile-post-footer" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <strong>{priceLabel}</strong>
          <span>{post.available_at ? formatDateTime(post.available_at, locale) : t('common.available')}</span>
        </div>

        {showArtisan && post.artisan && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-200)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>{t('common.by')} <strong>{post.artisan.user?.name}</strong></span>
          </div>
        )}
      </div>
    </article>
  );
}
