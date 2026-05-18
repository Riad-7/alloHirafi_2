import { useEffect, useState } from 'react';
import ArtisanCard from '../components/ArtisanCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { buildAvatarUrl } from '../utils/userPresentation.js';

export default function SearchPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ metier: '', ville: '', note: '' });
  const [prompt, setPrompt] = useState('plombier pas cher disponible a Agadir');
  const [artisans, setArtisans] = useState([]);
  const [posts, setPosts] = useState([]);
  const [aiFilters, setAiFilters] = useState(null);
  const [message, setMessage] = useState('');

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
          setMessage('Impossible de charger les donnees.');
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyFilters = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const params = new URLSearchParams({
        metier: filters.metier,
        ville: filters.ville,
        note: filters.note,
      });
      const data = await apiRequest(`/artisans?${params.toString()}`);
      setArtisans(data.artisans);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const runAiSearch = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const data = await apiRequest('/search/ai', {
        method: 'POST',
        body: { prompt },
      });
      setAiFilters(data.filters);
      setArtisans(data.artisans);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const contactArtisan = async (artisan) => {
    if (!user) {
      setMessage('Connecte-toi comme client pour envoyer un message.');
      return;
    }

    try {
      await apiRequest('/conversations', {
        method: 'POST',
        body: {
          artisan_id: artisan.user_id,
          message: `Bonjour ${artisan.user.name}, je viens depuis la recherche AloHirafi.`,
        },
      });
      setMessage(`Conversation creee avec ${artisan.user.name}.`);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section className="stack-layout">
      <div className="panel search-banner">
        <div>
          <p className="eyebrow">Recherche standard + recherche inspiree IA</p>
          <h2>Trouve un artisan selon ton besoin reel</h2>
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

      {message ? <div className="panel error-box">{message}</div> : null}

      <div className="two-column">
        <form className="panel form-panel" onSubmit={applyFilters}>
          <h3>Filtres classiques</h3>
          <label>
            Metier
            <select className="form-select" value={filters.metier} onChange={(e) => setFilters({ ...filters, metier: e.target.value })}>
              <option value="">Tous les metiers</option>
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
            Ville
            <select className="form-select" value={filters.ville} onChange={(e) => setFilters({ ...filters, ville: e.target.value })}>
              <option value="">Toutes les villes</option>
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
            Note minimum
            <input value={filters.note} onChange={(e) => setFilters({ ...filters, note: e.target.value })} />
          </label>
          <button className="ghost-button">Appliquer</button>
        </form>

        <form className="panel form-panel" onSubmit={runAiSearch}>
          <h3>Recherche IA</h3>
          <label>
            Besoin en langage naturel
            <textarea rows="5" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
          <button className="primary-button">Interpreter la demande</button>
        </form>
      </div>

      <div className="content-grid">
        <div className="card-grid">
          {artisans.map((artisan) => (
            <ArtisanCard key={artisan.id} artisan={artisan} onContact={contactArtisan} />
          ))}
        </div>

        <aside className="panel posts-panel">
          <div className="panel-heading">
            <h3>Annonces recentes</h3>
            <p>Publiees par les artisans actifs.</p>
          </div>

          <div className="mini-post-list">
            {posts.map((post) => (
              <article key={post.id} className="mini-post">
                <div className="mini-post-head">
                  <img src={buildAvatarUrl(post.artisan.user)} alt={post.artisan.user.name} className="avatar-xs" />
                  <div>
                    <strong>{post.title}</strong>
                    <span>{post.artisan.user.name}</span>
                  </div>
                </div>
                {post.images?.[0]?.image_url ? <img src={post.images[0].image_url} alt={post.title} className="mini-post-cover" /> : null}
                <small>
                  {post.city} - {post.price_from} - {post.price_to} DH
                </small>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

