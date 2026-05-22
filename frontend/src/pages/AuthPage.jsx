import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const registerInitial = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'client',
  city: '',
  phone: '',
  avatar: '',
  craft: '',
  bio: '',
  hourly_rate: '',
};

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLocalization();

  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: 'client@alohirafi.ma', password: 'password' });
  const [registerForm, setRegisterForm] = useState(registerInitial);

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await login(loginForm, '/login');
      toast.success(t('auth.toast_welcome'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || t('auth.toast_login_error'));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const formData = new FormData();

      Object.entries(registerForm).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      await register(formData, '/register');
      toast.success(t('auth.toast_register_success'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || t('auth.toast_register_error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-layout">
      <aside className="auth-showcase panel">
        <p className="eyebrow">AloHirafi Access</p>
        <h2>{t('auth.title')}</h2>
        <p className="muted-copy">{t('auth.subtitle')}</p>
        <div className="auth-pill-list">
          <div>
            <small>{t('common.role.client')}</small>
            <strong>client@alohirafi.ma / password</strong>
          </div>
          <div>
            <small>{t('common.role.artisan')}</small>
            <strong>artisan1@alohirafi.ma / password</strong>
          </div>
        </div>
      </aside>

      <div className="panel auth-panel">
        <div className="segmented auth-segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            {t('common.login')}
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            {t('auth.register_tab')}
          </button>
        </div>

        {mode === 'login' ? (
          <form className="form-panel auth-form" onSubmit={submitLogin}>
            <label>
              {t('auth.email')}
              <input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
            </label>
            <label>
              {t('auth.password')}
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? t('auth.logging_in') : t('auth.submit_login')}
            </button>
          </form>
        ) : (
          <form className="form-panel auth-form" onSubmit={submitRegister}>
            <div className="form-grid">
              <label>
                {t('auth.name')}
                <input value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} />
              </label>
              <label>
                {t('auth.email')}
                <input value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
              </label>
              <label>
                {t('auth.password')}
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                />
              </label>
              <label>
                {t('auth.password_confirmation')}
                <input
                  type="password"
                  value={registerForm.password_confirmation}
                  onChange={(event) => setRegisterForm({ ...registerForm, password_confirmation: event.target.value })}
                />
              </label>
              <label>
                {t('auth.city')}
                <input value={registerForm.city} onChange={(event) => setRegisterForm({ ...registerForm, city: event.target.value })} />
              </label>
              <label>
                {t('auth.phone')}
                <input value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} />
              </label>
              <label>
                {t('auth.avatar')}
                <input type="file" accept="image/*" onChange={(e) => setRegisterForm({ ...registerForm, avatar: e.target.files[0] })} />
              </label>
              <label>
                {t('auth.role')}
                <select value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                  <option value="client">{t('common.role.client')}</option>
                  <option value="artisan">{t('common.role.artisan')}</option>
                </select>
              </label>
              {registerForm.role === 'artisan' ? (
                <label>
                  {t('auth.craft')}
                  <input value={registerForm.craft} onChange={(event) => setRegisterForm({ ...registerForm, craft: event.target.value })} />
                </label>
              ) : null}
              {registerForm.role === 'artisan' ? (
                <label>
                  {t('auth.hourly_rate')}
                  <input
                    value={registerForm.hourly_rate}
                    onChange={(event) => setRegisterForm({ ...registerForm, hourly_rate: event.target.value })}
                  />
                </label>
              ) : null}
            </div>

            {registerForm.role === 'artisan' ? (
              <label>
                {t('auth.bio')}
                <textarea value={registerForm.bio} onChange={(event) => setRegisterForm({ ...registerForm, bio: event.target.value })} rows="4" />
              </label>
            ) : null}

            <button className="primary-button" disabled={busy}>
              {busy ? t('auth.creating') : t('auth.submit_register')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
