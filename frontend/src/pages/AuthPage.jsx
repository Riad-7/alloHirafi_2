import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const registerInitial = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'client',
  city: '',
  phone: '',
  craft: '',
  bio: '',
  hourly_rate: '',
};

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: 'client@alohirafi.ma', password: 'password' });
  const [registerForm, setRegisterForm] = useState(registerInitial);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await login(loginForm, '/login');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await login(registerForm, '/register');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-layout">
      <aside className="auth-showcase panel">
        <p className="eyebrow">AloHirafi Access</p>
        <h2>Espace securise pour clients et artisans</h2>
        <p className="muted-copy">
          Breeze + Sanctum gere l&apos;authentification de maniere fiable, avec session protegee et endpoints propres.
        </p>
        <div className="auth-pill-list">
          <div>
            <small>Test client</small>
            <strong>client@alohirafi.ma / password</strong>
          </div>
          <div>
            <small>Test artisan</small>
            <strong>artisan1@alohirafi.ma / password</strong>
          </div>
        </div>
      </aside>

      <div className="panel auth-panel">
        <div className="segmented auth-segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Register
          </button>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {mode === 'login' ? (
          <form className="form-panel auth-form" onSubmit={submitLogin}>
            <label>
              Email
              <input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              />
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form className="form-panel auth-form" onSubmit={submitRegister}>
            <div className="form-grid">
              <label>
                Nom
                <input value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} />
              </label>
              <label>
                Email
                <input value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                />
              </label>
              <label>
                Confirm Password
                <input
                  type="password"
                  value={registerForm.password_confirmation}
                  onChange={(event) => setRegisterForm({ ...registerForm, password_confirmation: event.target.value })}
                />
              </label>
              <label>
                Ville
                <input value={registerForm.city} onChange={(event) => setRegisterForm({ ...registerForm, city: event.target.value })} />
              </label>
              <label>
                Telephone
                <input value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} />
              </label>
              <label>
                Role
                <select value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                  <option value="client">Client</option>
                  <option value="artisan">Artisan</option>
                </select>
              </label>
              {registerForm.role === 'artisan' ? (
                <label>
                  Metier
                  <input value={registerForm.craft} onChange={(event) => setRegisterForm({ ...registerForm, craft: event.target.value })} />
                </label>
              ) : null}
              {registerForm.role === 'artisan' ? (
                <label>
                  Tarif horaire
                  <input
                    value={registerForm.hourly_rate}
                    onChange={(event) => setRegisterForm({ ...registerForm, hourly_rate: event.target.value })}
                  />
                </label>
              ) : null}
            </div>

            {registerForm.role === 'artisan' ? (
              <label>
                Bio
                <textarea value={registerForm.bio} onChange={(event) => setRegisterForm({ ...registerForm, bio: event.target.value })} rows="4" />
              </label>
            ) : null}

            <button className="primary-button" disabled={busy}>
              {busy ? 'Creation...' : 'Creer le compte'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
