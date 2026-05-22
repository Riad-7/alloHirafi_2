import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArtisanCard from '../components/ArtisanCard.jsx';
import PostCard from '../components/PostCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';

export default function SearchPage() {
  const { user } = useAuth();
  const { t } = useLocalization();
  const toast = useToast();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ metier: '', ville: '', note: '' });
  const [prompt, setPrompt] = useState('plombier pas cher disponible a Agadir');
  const [artisans, setArtisans] = useState([]);
  const [posts, setPosts] = useState([]);
  const [aiFilters, setAiFilters] = useState(null);
  const [activeTab, setActiveTab] = useState('artisans');

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [artisansData, postsData] = await Promise.all([apiRequest('/artisans'), apiRequest('/posts')]);

        if (!cancelled) {
          setArtisans(artisansData.artisans);
          setPosts(postsData.posts);
        }
      } catch {
        if (!cancelled) {
          toast.error(t('search.load_error'));
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  const applyFilters = async (event) => {
    event.preventDefault();

    try {
      const params = new URLSearchParams({
        metier: filters.metier,
        ville: filters.ville,
        note: filters.note,
      });
      const data = await apiRequest(`/artisans?${params.toString()}`);
      setArtisans(data.artisans);
    } catch (err) {
      toast.error(err.message || t('search.filter_error'));
    }
  };

  const runAiSearch = async (event) => {
    event.preventDefault();

    try {
      const data = await apiRequest('/search/ai', {
        method: 'POST',
        body: { prompt },
      });
      setAiFilters(data.filters);
      setArtisans(data.artisans);
    } catch (err) {
      toast.error(err.message || t('search.ai_error'));
    }
  };

  const contactArtisan = async (artisan) => {
    if (!user) {
      toast.error(t('search.login_required'));
      return;
    }

    try {
      await apiRequest('/conversations', {
        method: 'POST',
        body: {
          artisan_id: artisan.user_id,
          message: t('search.contact_message', { name: artisan.user.name }),
        },
      });
      toast.success(t('search.contact_success', { name: artisan.user.name }));
      navigate('/inbox');
    } catch (err) {
      toast.error(err.message || t('search.contact_error'));
    }
  };

  return (
    <section className="stack-layout">
      <div className="panel search-banner" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, var(--blue-600), var(--blue-800))', color: 'white', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p className="eyebrow" style={{ color: 'black', marginBottom: '0.5rem' }}>{t('search.banner_eyebrow')}</p>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'black' }}>{t('search.banner_title')}</h2>
          <form onSubmit={runAiSearch} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', backdropFilter: 'blur(10px)' }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('search.ai_placeholder')}
              style={{ flex: 1, padding: '0.75rem 1rem', border: 'none', borderRadius: '0.25rem', outline: 'none' }}
            />
            <button className="primary-button" style={{ whiteSpace: 'nowrap' }}>{t('search.ai_button')}</button>
          </form>
        </div>
        {aiFilters ? (
          <div className="ai-chip-row">
            {Object.entries(aiFilters)
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <span key={key} className="ai-chip">
                  {key}: {String(value)}
                </span>
              ))}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`ghost-button ${activeTab === 'artisans' ? 'active' : ''}`}
          onClick={() => setActiveTab('artisans')}
          style={activeTab === 'artisans' ? { background: 'var(--blue-50)', color: 'var(--blue-700)', borderColor: 'var(--blue-200)' } : {}}
        >
          {t('search.tab_artisans')}
        </button>
        <button
          className={`ghost-button ${activeTab === 'annonces' ? 'active' : ''}`}
          onClick={() => setActiveTab('annonces')}
          style={activeTab === 'annonces' ? { background: 'var(--blue-50)', color: 'var(--blue-700)', borderColor: 'var(--blue-200)' } : {}}
        >
          {t('search.tab_posts')}
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <form className="panel" onSubmit={applyFilters} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', padding: '1.5rem' }}>
          <label style={{ flex: '1 1 200px', margin: 0 }}>
            {t('search.craft')}
            <select className="form-select" value={filters.metier} onChange={(e) => setFilters({ ...filters, metier: e.target.value })}>
              <option value="">{t('search.all_crafts')}</option>
              <option value="Plombier">Plombier</option>
              <option value="Electricien">Electricien</option>
              <option value="Menuisier">Menuisier</option>
              <option value="Peintre">Peintre</option>
              <option value="Macon">Macon</option>
              <option value="Jardinier">Jardinier</option>
              <option value="Serrurier">Serrurier</option>
              <option value="Nettoyage">Nettoyage</option>
            </select>
          </label>
          <label>
            {t('auth.city')}
            <select className="form-select" value={filters.ville} onChange={(e) => setFilters({ ...filters, ville: e.target.value })}>
              <option value="">{t('search.all_cities')}</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Rabat">Rabat</option>
              <option value="Marrakech">Marrakech</option>
              <option value="Fes">Fes</option>
              <option value="Tanger">Tanger</option>
              <option value="Agadir">Agadir</option>
              <option value="Oujda">Oujda</option>
              <option value="Kenitra">Kenitra</option>
            </select>
          </label>
          <label>
            {t('search.min_rating')}
            <input value={filters.note} onChange={(e) => setFilters({ ...filters, note: e.target.value })} />
          </label>
          <button className="primary-button" style={{ height: '42px' }}>{t('search.filter_button')}</button>
        </form>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {activeTab === 'artisans' && (
          <>
            {artisans.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <h4>{t('search.no_artisans_title')}</h4>
                <p>{t('search.no_artisans_body')}</p>
              </div>
            ) : (
              <div className="card-grid">
                {artisans.map((artisan) => (
                  <ArtisanCard key={artisan.id} artisan={artisan} onContact={contactArtisan} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'annonces' && (
          <>
            {posts.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '1rem' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <h4>{t('search.no_posts_title')}</h4>
                <p>{t('search.no_posts_body')}</p>
              </div>
            ) : (
              <div className="card-grid">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} showArtisan={true} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
