import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

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
  const { t } = useLocalization();
  const toast = useToast();
  const [form, setForm] = useState(buildProfileForm(user));
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
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

  const avatarPreview = useMemo(() => {
    if (form.avatarFile) return URL.createObjectURL(form.avatarFile);
    return form.avatar?.trim() ? form.avatar : buildAvatarUrl({ name: form.name || user?.name || 'User' });
  }, [form.avatarFile, form.avatar, form.name, user?.name]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
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
        method: 'POST',
        body: formData,
      });

      await refreshUser();
      toast.success(t('profile.save_success'));
    } catch (err) {
      toast.error(err.message || t('profile.save_error'));
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
      toast.success(t('profile.password_success'));
    } catch (err) {
      toast.error(err.message || t('profile.password_error'));
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
            <p className="eyebrow">{t('common.profile')}</p>
            <h2>{form.name || t('profile.my_account')}</h2>
            <p className="muted-copy">
              {formatRole(user?.role, t)} - {form.city || t('common.morocco')}
            </p>
          </div>
        </div>
        <div className="status-pill">{t('profile.secure_account')}</div>
      </div>

      <div className="two-column profile-columns">
        <div className="stack-layout">
          <form className="panel form-panel" onSubmit={updateProfile}>
            <div className="panel-heading">
              <h3>{t('profile.personal_info')}</h3>
              <p>{t('profile.personal_info_body')}</p>
            </div>

            <div className="form-grid">
              <label>
                {t('profile.full_name')}
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                {t('auth.email')}
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
              <label>
                {t('auth.city')}
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <label>
                {t('auth.phone')}
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="profile-full-row">
                {t('auth.avatar')}
                <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, avatarFile: e.target.files[0] })} />
              </label>
            </div>

            {user?.role === 'artisan' ? (
              <div className="profile-artisan-grid">
                <label>
                  {t('auth.craft')}
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
                  {t('profile.hourly_rate_dh')}
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
                  {t('profile.experience_years')}
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
                  {t('profile.service_radius')}
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
                  {t('profile.artisan_bio')}
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
                  {t('profile.available_for_clients')}
                </label>
              </div>
            ) : null}

            <button className="primary-button" disabled={busy}>
              {busy ? t('profile.saving') : t('profile.save_button')}
            </button>
          </form>

          {user?.role === 'artisan' && (
            <VerificationSection user={user} refreshUser={refreshUser} />
          )}
        </div>

        <form className="panel form-panel" onSubmit={updatePassword}>
          <div className="panel-heading">
            <h3>{t('profile.account_security')}</h3>
            <p>{t('profile.account_security_body')}</p>
          </div>
          <label>
            {t('profile.current_password')}
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              required
            />
          </label>
          <label>
            {t('profile.new_password')}
            <input
              type="password"
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              required
            />
          </label>
          <label>
            {t('auth.password_confirmation')}
            <input
              type="password"
              value={passwordForm.password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
              required
            />
          </label>
          <button className="ghost-button" disabled={passwordBusy}>
            {passwordBusy ? t('profile.saving') : t('profile.password_button')}
          </button>
        </form>
      </div>
    </section>
  );
}

function VerificationSection({ user, refreshUser }) {
  const { t } = useLocalization();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState('cin');
  const [docFile, setDocFile] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!docFile) return toast.error(t('profile.verification_select_document'));

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
      toast.success(t('profile.verification_sent'));
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
          <h3>{t('profile.verification_title')}</h3>
          <p>{t('profile.verification_verified_body')}</p>
        </div>
        <div className="success-box verification-badge-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="9 11 12 14 15 9"></polyline></svg>
          <strong>{t('profile.verified_account')}</strong>
        </div>
      </div>
    );
  }

  if (user.verification_status === 'pending') {
    return (
      <div className="panel verification-panel pending-status">
        <div className="panel-heading">
          <h3>{t('profile.verification_title')}</h3>
          <p>{t('profile.verification_pending_body')}</p>
        </div>
        <div className="info-box">
          <p><strong>{t('profile.verification_in_progress')}</strong></p>
          <small className="muted-copy">{t('profile.verification_delay')}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="panel verification-panel">
      <div className="panel-heading">
        <h3>{t('profile.verification_title')}</h3>
        <p>{t('profile.verification_intro')}</p>
      </div>

      {user.verification_status === 'rejected' && (
        <div className="error-box rejection-note">
          <strong>{t('profile.verification_rejected')}</strong>
          <p>{user.rejection_note || t('profile.verification_rejected_body')}</p>
        </div>
      )}

      <form className="verification-form stack-layout" onSubmit={handleVerify}>
        <label>
          {t('profile.document_type')}
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="form-select">
            <option value="cin">{t('profile.document_cin')}</option>
            <option value="diploma">{t('profile.document_diploma')}</option>
          </select>
        </label>
        <label>
          {t('profile.document_file')}
          <input type="file" accept=".pdf,image/*" onChange={(e) => setDocFile(e.target.files[0])} required />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? t('profile.sending') : t('profile.submit_verification')}
        </button>
      </form>
    </div>
  );
}
