import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const registerInitial = {
  name: '',
  email: '',
  password: '',
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
  const [loginForm, setLoginForm] = useState({ email: 'client@alohirafi.ma', password: 'password' });
  const [registerForm, setRegisterForm] = useState(registerInitial);
  const [error, setError] = useState('');

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(loginForm, '/login');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(registerForm, '/register');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="two-column">
      <div className="panel">
        <p className="eyebrow">Acces rapide</p>
        <h2>Entre comme client ou artisan</h2>
        <p className="muted-copy">
          Compte de test client: <strong>client@alohirafi.ma</strong> / <strong>password</strong>
        </p>
        <p className="muted-copy">
          Compte de test artisan: <strong>artisan1@alohirafi.ma</strong> / <strong>password</strong>
        </p>

        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {mode === 'login' ? (
          <form className="form-panel" onSubmit={submitLogin}>
            <label>
              Email
              <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </label>
            <button className="primary-button">Se connecter</button>
          </form>
        ) : (
          <form className="form-panel" onSubmit={submitRegister}>
            <div className="form-grid">
              <label>
                Nom
                <input value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
              </label>
              <label>
                Email
                <input value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
              </label>
              <label>
                Ville
                <input value={registerForm.city} onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })} />
              </label>
              <label>
                Telephone
                <input value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              </label>
              <label>
                Role
                <select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                  <option value="client">Client</option>
                  <option value="artisan">Artisan</option>
                </select>
              </label>
              {registerForm.role === 'artisan' ? (
                <>
                  <label>
                    Metier
                    <input value={registerForm.craft} onChange={(e) => setRegisterForm({ ...registerForm, craft: e.target.value })} />
                  </label>
                  <label>
                    Tarif horaire
                    <input
                      value={registerForm.hourly_rate}
                      onChange={(e) => setRegisterForm({ ...registerForm, hourly_rate: e.target.value })}
                    />
                  </label>
                </>
              ) : null}
            </div>

            {registerForm.role === 'artisan' ? (
              <label>
                Bio
                <textarea value={registerForm.bio} onChange={(e) => setRegisterForm({ ...registerForm, bio: e.target.value })} rows="4" />
              </label>
            ) : null}

            <button className="primary-button">Creer le compte</button>
          </form>
        )}
      </div>
    </section>
  );
}
