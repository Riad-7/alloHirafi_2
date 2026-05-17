import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

function buildProfileForm(user) {
  return {
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
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
  const [form, setForm] = useState(buildProfileForm(user));
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    const sync = async () => {
      try {
        await refreshUser();
      } catch {
        // Best effort sync.
      }
    };

    sync();
  }, [refreshUser]);

  const avatarPreview = useMemo(
    () => (form.avatar?.trim() ? form.avatar : buildAvatarUrl({ name: form.name || user?.name || 'User' })),
    [form.avatar, form.name, user?.name],
  );

  const updateProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');

    try {
      const payload = {
        name: form.name,
        email: form.email,
        city: form.city,
        phone: form.phone,
        avatar: form.avatar || null,
      };

      if (user?.role === 'artisan') {
        payload.artisan_profile = {
          craft: form.artisan_profile.craft,
          bio: form.artisan_profile.bio,
          hourly_rate: form.artisan_profile.hourly_rate || null,
          years_experience: form.artisan_profile.years_experience || null,
          service_radius_km: form.artisan_profile.service_radius_km || null,
          is_available: !!form.artisan_profile.is_available,
        };
      }

      await apiRequest('/profile', {
        method: 'PATCH',
        body: payload,
      });

      await refreshUser();
      setStatus('Profil mis a jour avec succes.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setPasswordBusy(true);
    setError('');
    setStatus('');

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
      setStatus('Mot de passe mis a jour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setPasswordBusy(false);
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

      {status ? <div className="panel success-box">{status}</div> : null}
      {error ? <div className="panel error-box">{error}</div> : null}

      <div className="two-column profile-columns">
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
              URL image profile
              <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." />
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
    </section>
  );
}
