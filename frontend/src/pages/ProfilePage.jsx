import { useEffect, useMemo, useState } from 'react';
import PostComposer from '../components/PostComposer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, buildMediaUrl, formatRole } from '../utils/userPresentation.js';

function buildProfileForm(user) {
  return {
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    avatarFile: null,
    artisan_profile: {
      craft: user?.artisan_profile?.craft || '',
      bio: user?.artisan_profile?.bio || '',
      hourly_rate: user?.artisan_profile?.hourly_rate || '',
      years_experience: user?.artisan_profile?.years_experience || '',
      service_radius_km: user?.artisan_profile?.service_radius_km || '',
      is_available: user?.artisan_profile?.is_available ?? true,
    },
  };
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(buildProfileForm(user));
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [posts, setPosts] = useState([]);

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

  const avatarPreview = useMemo(() => {
    if (form.avatarFile) return URL.createObjectURL(form.avatarFile);
    return form.avatar?.trim() ? form.avatar : buildAvatarUrl({ name: form.name || user?.name || 'User' });
  }, [form.avatarFile, form.avatar, form.name, user?.name]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append('_method', 'PATCH'); // Laravel requires _method=PATCH for FormData
      formData.append('name', form.name);
      formData.append('email', form.email);
      if (form.city) formData.append('city', form.city);
      if (form.phone) formData.append('phone', form.phone);
      if (form.avatarFile) formData.append('avatar', form.avatarFile);

      if (user?.role === 'artisan') {
        formData.append('artisan_profile[craft]', form.artisan_profile.craft);
        if (form.artisan_profile.bio) formData.append('artisan_profile[bio]', form.artisan_profile.bio);
        if (form.artisan_profile.hourly_rate) formData.append('artisan_profile[hourly_rate]', form.artisan_profile.hourly_rate);
        if (form.artisan_profile.years_experience) formData.append('artisan_profile[years_experience]', form.artisan_profile.years_experience);
        if (form.artisan_profile.service_radius_km) formData.append('artisan_profile[service_radius_km]', form.artisan_profile.service_radius_km);
        formData.append('artisan_profile[is_available]', form.artisan_profile.is_available ? '1' : '0');
      }

      await apiRequest('/profile', {
        method: 'POST', // Use POST with _method=PATCH for multipart/form-data in Laravel
        body: formData,
      });

      await refreshUser();
      toast.success('Profil mis a jour avec succes.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise a jour');
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setPasswordBusy(true);

    try {
      await apiRequest('/profile/password', {
        method: 'PATCH',
        body: passwordForm,
      });

      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      toast.success('Mot de passe mis a jour.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPasswordBusy(false);
    }
  };

  const publishPost = async (payload) => {
    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: payload,
      });
      const profileData = await apiRequest('/profile');
      setPosts(profileData.posts ?? []);
      toast.success('Annonce publiee avec succes.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la publication');
    }
  };

  return (
    <section className="stack-layout profile-layout">
      <div className="panel profile-hero">
        <div className="profile-hero-user">
          <img src={avatarPreview} alt={form.name || user?.name} className="avatar-lg" />
          <div>
            <p className="eyebrow">Profil</p>
            <h2>{form.name || 'Mon compte'}</h2>
            <p className="muted-copy">
              {formatRole(user?.role)} - {form.city || 'Maroc'}
            </p>
          </div>
        </div>
        <div className="status-pill">Compte securise</div>
      </div>

      <div className="two-column profile-columns">
        <div className="stack-layout">
          <form className="panel form-panel" onSubmit={updateProfile}>
            <div className="panel-heading">
              <h3>Informations personnelles</h3>
              <p>Garde ton profil clair et professionnel.</p>
            </div>

            <div className="form-grid">
              <label>
                Nom complet
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label>
                Ville
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <label>
                Telephone
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="profile-full-row">
                Image de profil
                <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, avatarFile: e.target.files[0] })} />
              </label>
            </div>

            {user?.role === 'artisan' ? (
              <div className="profile-artisan-grid">
                <label>
                  Metier
                  <input
                    value={form.artisan_profile.craft}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        artisan_profile: { ...form.artisan_profile, craft: e.target.value },
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Tarif horaire (DH)
                  <input
                    type="number"
                    min="0"
                    value={form.artisan_profile.hourly_rate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        artisan_profile: { ...form.artisan_profile, hourly_rate: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Experience (ans)
                  <input
                    type="number"
                    min="0"
                    value={form.artisan_profile.years_experience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        artisan_profile: { ...form.artisan_profile, years_experience: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Rayon service (km)
                  <input
                    type="number"
                    min="0"
                    value={form.artisan_profile.service_radius_km}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        artisan_profile: { ...form.artisan_profile, service_radius_km: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="profile-full-row">
                  Bio artisan
                  <textarea
                    rows="4"
                    value={form.artisan_profile.bio}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        artisan_profile: { ...form.artisan_profile, bio: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="switch-row profile-full-row">
                  <input
                    type="checkbox"
                    checked={!!form.artisan_profile.is_available}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        artisan_profile: { ...form.artisan_profile, is_available: e.target.checked },
                      })
                    }
                  />
                  Disponible pour nouveaux clients
                </label>
              </div>
            ) : null}

            <button className="primary-button" disabled={busy}>
              {busy ? 'Mise a jour...' : 'Sauvegarder le profil'}
            </button>
          </form>

          {user?.role === 'artisan' && (
            <VerificationSection user={user} refreshUser={refreshUser} />
          )}
        </div>

        <form className="panel form-panel" onSubmit={updatePassword}>
          <div className="panel-heading">
            <h3>Securite du compte</h3>
            <p>Change ton mot de passe regulierement.</p>
          </div>
          <label>
            Mot de passe actuel
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              required
            />
          </label>
          <label>
            Nouveau mot de passe
            <input
              type="password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              required
            />
          </label>
          <label>
            Confirmation mot de passe
            <input
              type="password"
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
              required
            />
          </label>
          <button className="ghost-button" disabled={passwordBusy}>
            {passwordBusy ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
          </button>
        </form>
      </div>

      {user?.role === 'artisan' ? (
        <section className="profile-posts-section">
          <div className="profile-posts-hero">
            <div>
              <p className="eyebrow">Annonces</p>
              <h2>Ton portfolio commercial</h2>
              <p className="muted-copy">Publie tes services avec des photos nettes pour attirer les bons clients.</p>
            </div>
            <span className="status-pill">{posts.length} annonce{posts.length > 1 ? 's' : ''}</span>
          </div>

          <div className="profile-posts-layout">
            <PostComposer onSubmit={publishPost} />

            <div className="profile-posts-list">
              {posts.length === 0 ? (
                <div className="empty-state profile-posts-empty">
                  <h4>Aucune annonce publiee</h4>
                  <p>Ajoute ta premiere annonce avec une image pour rendre ton profil plus convaincant.</p>
                </div>
              ) : (
                posts.map((post) => <ProfilePostCard key={post.id} post={post} />)
              )}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function ProfilePostCard({ post }) {
  const cover = buildMediaUrl(post.images?.[0]?.image_url);
  const priceLabel =
    post.price_from || post.price_to
      ? `${post.price_from ?? '0'} - ${post.price_to ?? post.price_from} DH`
      : 'Prix sur devis';

  return (
    <article className="profile-post-card">
      <div className="profile-post-media">
        {cover ? (
          <img src={cover} alt={post.title} />
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
          <strong>{priceLabel}</strong>
          <span>{post.available_at ? formatDateTime(post.available_at) : 'Disponible'}</span>
        </div>
      </div>
    </article>
  );
}

function VerificationSection({ user, refreshUser }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState('cin');
  const [docFile, setDocFile] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!docFile) return toast.error('Veuillez selectionner un document.');

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('document', docFile);

      await apiRequest('/profile/verify', {
        method: 'POST',
        body: formData,
      });

      await refreshUser();
      toast.success('Demande de verification envoyee.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (user.is_verified) {
    return (
      <div className="panel verification-panel success-status">
        <div className="panel-heading">
          <h3>Vérification du compte</h3>
          <p>Ton compte est officiellement vérifié.</p>
        </div>
        <div className="success-box verification-badge-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="9 11 12 14 15 9"></polyline></svg>
          <strong>Compte Vérifié</strong>
        </div>
      </div>
    );
  }

  if (user.verification_status === 'pending') {
    return (
      <div className="panel verification-panel pending-status">
        <div className="panel-heading">
          <h3>Vérification du compte</h3>
          <p>Nous examinons tes documents.</p>
        </div>
        <div className="info-box">
          <p><strong>Vérification en cours...</strong></p>
          <small className="muted-copy">Cela prend generalement 24h a 48h.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="panel verification-panel">
      <div className="panel-heading">
        <h3>Vérification du compte</h3>
        <p>Deviens un artisan vérifié pour gagner plus de confiance.</p>
      </div>

      {user.verification_status === 'rejected' && (
        <div className="error-box rejection-note">
          <strong>Demande rejetée</strong>
          <p>{user.rejection_note || 'Tes documents ne correspondent pas a nos criteres.'}</p>
        </div>
      )}

      <form className="verification-form stack-layout" onSubmit={handleVerify}>
        <label>
          Type de document
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="form-select">
            <option value="cin">Carte d'Identité Nationale (CIN)</option>
            <option value="diploma">Diplôme ou Certification</option>
          </select>
        </label>
        <label>
          Fichier du document (PDF, JPG, PNG)
          <input type="file" accept=".pdf,image/*" onChange={(e) => setDocFile(e.target.files[0])} required />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? 'Envoi...' : 'Soumettre pour vérification'}
        </button>
      </form>
    </div>
  );
}
