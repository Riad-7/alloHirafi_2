import { Link } from 'react-router-dom';

const highlights = [
  'Recherche d artisans par ville, metier et disponibilite',
  'Messagerie client-artisan avec conversations persistantes',
  'Devis, avis et notifications pour creer une vraie relation',
];

export default function HomePage() {
  return (
    <section className="hero-layout">
      <div className="hero-card hero-copy">
        <p className="eyebrow">Marketplace humain pour le terrain marocain</p>
        <h1>Trouver un artisan fiable doit ressembler a une vraie discussion, pas a une liste froide.</h1>
        <p className="muted-copy">
          AloHirafi connecte clients et artisans avec profils riches, annonces, devis et messages. Le socle est
          pense pour devenir un projet PFE solide et deployable.
        </p>

        <div className="hero-actions">
          <Link to="/search" className="primary-button">
            Explorer les artisans
          </Link>
          <Link to="/auth" className="ghost-button">
            Creer un compte
          </Link>
        </div>
      </div>

      <div className="hero-card hero-side">
        <div className="signal-card">
          <span>Interaction humaine</span>
          <strong>Message, devis, avis</strong>
          <p>Le produit tourne autour de la confiance et du suivi.</p>
        </div>

        <div className="feature-list">
          {highlights.map((item) => (
            <article key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
