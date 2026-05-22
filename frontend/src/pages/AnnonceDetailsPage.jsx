import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildMediaUrl, buildAvatarUrl } from '../utils/userPresentation.js';
import PostComposer from '../components/PostComposer.jsx';

export default function AnnonceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, t } = useLocalization();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchPost = async () => {
    try {
      const data = await apiRequest(`/posts/${id}`);
      setPost(data.post);
    } catch (err) {
      toast.error(err.message || t('post_details.load_error'));
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const isOwner = user?.role === 'artisan' && user?.artisan_profile?.id === post?.artisan_id;

  const handleUpdate = async (payload) => {
    try {
      payload.append('_method', 'PUT');
      await apiRequest(`/posts/${id}`, {
        method: 'POST',
        body: payload,
      });
      toast.success(t('posts.update_success'));
      setEditing(false);
      fetchPost();
    } catch (err) {
      toast.error(err.message || t('posts.save_error'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('posts.delete_confirm'))) return;

    try {
      await apiRequest(`/posts/${id}`, {
        method: 'DELETE',
      });
      toast.success(t('posts.delete_success'));
      navigate('/annonces');
    } catch (err) {
      toast.error(err.message || t('posts.delete_error'));
    }
  };

  if (loading) {
    return <div className="shell-loader">{t('post_details.loading')}</div>;
  }

  if (!post) {
    return <div className="shell-loader">{t('post_details.not_found')}</div>;
  }

  if (editing) {
    return (
      <section className="page-wrap" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <button className="ghost-button" onClick={() => setEditing(false)} style={{ marginBottom: '1rem' }}>
          ← {t('post_details.back_to_details')}
        </button>
        <PostComposer
          initialData={post}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  }

  const cover = buildMediaUrl(post.images?.[0]?.image_url);
  const priceLabel = post.price_from || post.price_to
    ? `${post.price_from ?? '0'} - ${post.price_to ?? post.price_from} DH`
    : t('common.price_on_quote');

  const artisanAvatar = buildAvatarUrl(post.artisan?.user);

  return (
    <section className="page-wrap" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      <button className="ghost-button" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← {t('post_details.back')}
      </button>

      <div className="panel" style={{ overflow: 'hidden' }}>
        {cover && (
          <div style={{ width: '100%', height: '300px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
            <img
              src={cover}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="eyebrow" style={{ color: 'var(--blue-600)' }}>{post.city}</span>
              <h1 style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '2rem' }}>{post.title}</h1>
            </div>

            {isOwner && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="ghost-button"
                  onClick={() => setEditing(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  {t('common.edit')}
                </button>
                <button
                  className="ghost-button"
                  style={{ color: 'var(--red-600)' }}
                  onClick={handleDelete}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
            <div>
              <p className="muted-copy" style={{ fontSize: '0.875rem' }}>{t('post_details.estimated_price')}</p>
              <strong style={{ fontSize: '1.25rem' }}>{priceLabel}</strong>
            </div>
            <div>
              <p className="muted-copy" style={{ fontSize: '0.875rem' }}>{t('post_details.availability')}</p>
              <strong style={{ fontSize: '1.25rem' }}>{post.available_at ? formatDateTime(post.available_at, locale) : t('common.available_now')}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{t('post_details.service_description')}</h3>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6', color: 'var(--slate-700)' }}>
              {post.description}
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--slate-200)', margin: '2rem 0' }} />

          <div>
            <h3 style={{ marginBottom: '1rem' }}>{t('post_details.about_artisan')}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={artisanAvatar} alt={post.artisan?.user?.name} className="avatar-md" />
              <div>
                <h4 style={{ margin: 0 }}>{post.artisan?.user?.name}</h4>
                <p className="muted-copy" style={{ margin: 0 }}>{post.artisan?.craft}</p>
              </div>
              <button
                className="primary-button"
                style={{ marginInlineStart: 'auto' }}
                onClick={() => navigate(`/users/${post.artisan?.user?.id}`)}
              >
                {t('common.view_profile')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
