import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PostComposer from '../components/PostComposer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildMediaUrl } from '../utils/userPresentation.js';
import PostCard from '../components/PostCard.jsx';



export default function AnnoncesPage() {
  const { user, refreshUser } = useAuth();
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
          method: 'POST', // Use POST with _method=PUT for multipart/form-data
          body: payload,
        });
        toast.success('Annonce mise à jour avec succès.');
        setEditingPost(null);
      } else {
        await apiRequest('/posts', {
          method: 'POST',
          body: payload,
        });
        toast.success('Annonce publiée avec succès.');
      }
      
      const profileData = await apiRequest('/profile');
      setPosts(profileData.posts ?? []);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm('Es-tu sûr de vouloir supprimer cette annonce ?')) return;
    
    try {
      await apiRequest(`/posts/${post.id}`, {
        method: 'DELETE',
      });
      setPosts(posts.filter((p) => p.id !== post.id));
      toast.success('Annonce supprimée avec succès.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  if (user?.role !== 'artisan') {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="stack-layout profile-layout" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <div className="profile-posts-hero" style={{ marginBottom: '2rem' }}>
        <div>
          <p className="eyebrow">Mes Annonces</p>
          <h2>Ton espace pro</h2>
          <p className="muted-copy">Crée des annonces attrayantes pour présenter tes services professionnels.</p>
        </div>
        <span className="status-pill">{posts.length} annonce{posts.length > 1 ? 's' : ''}</span>
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
              <h4>Aucune annonce publiée</h4>
              <p>Ajoute ta première annonce avec une image pour attirer plus de clients.</p>
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
