import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, buildMediaUrl, formatRole } from '../utils/userPresentation.js';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
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
          toast.error(err.message || 'Profil introuvable.');
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const contactProfile = async () => {
    if (!user) {
      toast.error('Connecte-toi pour envoyer un message.');
      return;
    }

    if (!profile || profile.role !== 'artisan') {
      toast.error('Tu peux contacter seulement les artisans.');
      return;
    }

    setBusy(true);
    try {
      await apiRequest('/conversations', {
        method: 'POST',
        body: {
          artisan_id: profile.id,
          message: `Bonjour ${profile.name}, je viens depuis ton profil AloHirafi.`,
        },
      });
      toast.success(`Conversation creee avec ${profile.name}.`);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la prise de contact');
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return <div className="shell-loader">Chargement du profil...</div>;
  }

  const artisan = profile.artisan_profile;
  const posts = profile.posts ?? [];

  return (
    <section className="stack-layout public-profile-page">
      <div className="public-profile-hero">
        <img src={buildAvatarUrl(profile)} alt={profile.name} className="avatar-lg" />
        <div>
          <p className="eyebrow">{formatRole(profile.role)}</p>
          <h1>{profile.name}</h1>
          <p className="muted-copy">{profile.city || 'Maroc'}</p>
        </div>
        {profile.role === 'artisan' && user?.id !== profile.id ? (
          <button className="primary-button" onClick={contactProfile} disabled={busy}>
            {busy ? 'Ouverture...' : 'Contacter'}
          </button>
        ) : null}
      </div>

      {artisan ? (
        <div className="profile-summary-grid">
          <article className="stat-card">
            <span>Metier</span>
            <strong>{artisan.craft}</strong>
          </article>
          <article className="stat-card">
            <span>Tarif</span>
            <strong>{artisan.hourly_rate} DH</strong>
            <small>/heure</small>
          </article>
          <article className="stat-card">
            <span>Experience</span>
            <strong>{artisan.years_experience} ans</strong>
          </article>
        </div>
      ) : null}

      {artisan?.bio ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>A propos</h3>
          </div>
          <p className="muted-copy">{artisan.bio}</p>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Annonces</h3>
            <p>Services publies par {profile.name}.</p>
          </div>
          <div className="profile-posts-list">
            {posts.map((post) => (
              <article key={post.id} className="profile-post-card">
                <div className="profile-post-media">
                  {post.images?.[0]?.image_url ? (
                    <img src={buildMediaUrl(post.images[0].image_url)} alt={post.title} />
                  ) : (
                    <div className="profile-post-placeholder">
                      <span>Image</span>
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
                    <strong>{post.price_from || post.price_to ? `${post.price_from ?? '0'} - ${post.price_to ?? post.price_from} DH` : 'Prix sur devis'}</strong>
                    <span>{post.available_at ? formatDateTime(post.available_at) : 'Disponible'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <Link to="/search" className="ghost-button public-profile-back">
        Retour a la recherche
      </Link>
    </section>
  );
}
