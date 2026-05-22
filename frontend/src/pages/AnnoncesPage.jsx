import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import PostComposer from '../components/PostComposer.jsx';
import PostCard from '../components/PostCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';

export default function AnnoncesPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useLocalization();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    const sync = async () => {
      try {
        const profileData = await apiRequest('/profile');
        setPosts(profileData.posts ?? []);
        await refreshUser();
      } catch {
        // Best effort sync.
      }
    };

    sync();
  }, [refreshUser]);

  const publishPost = async (payload) => {
    try {
      if (editingPost) {
        payload.append('_method', 'PUT');
        await apiRequest(`/posts/${editingPost.id}`, {
          method: 'POST',
          body: payload,
        });
        toast.success(t('posts.update_success'));
        setEditingPost(null);
      } else {
        await apiRequest('/posts', {
          method: 'POST',
          body: payload,
        });
        toast.success(t('posts.publish_success'));
      }

      const profileData = await apiRequest('/profile');
      setPosts(profileData.posts ?? []);
    } catch (err) {
      toast.error(err.message || t('posts.save_error'));
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(t('posts.delete_confirm'))) return;

    try {
      await apiRequest(`/posts/${post.id}`, {
        method: 'DELETE',
      });
      setPosts(posts.filter((p) => p.id !== post.id));
      toast.success(t('posts.delete_success'));
    } catch (err) {
      toast.error(err.message || t('posts.delete_error'));
    }
  };

  if (user?.role !== 'artisan') {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="stack-layout profile-layout" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="profile-posts-hero" style={{ marginBottom: '2rem' }}>
        <div>
          <p className="eyebrow">{t('posts.hero_eyebrow')}</p>
          <h2>{t('posts.hero_title')}</h2>
          <p className="muted-copy">{t('posts.hero_body')}</p>
        </div>
        <span className="status-pill">{t('posts.count_label', { count: posts.length })}</span>
      </div>

      <div className="profile-posts-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {editingPost ? (
          <div className="edit-modal-wrapper" style={{ marginBottom: '2rem' }}>
            <PostComposer
              initialData={editingPost}
              onSubmit={publishPost}
              onCancel={() => setEditingPost(null)}
            />
          </div>
        ) : (
          <PostComposer onSubmit={publishPost} />
        )}

        <div className="profile-posts-list">
          {posts.length === 0 ? (
            <div className="empty-state profile-posts-empty">
              <h4>{t('posts.empty_title')}</h4>
              <p>{t('posts.empty_body')}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={(p) => {
                  setEditingPost(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
