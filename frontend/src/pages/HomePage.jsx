import { Link } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext.jsx';

export default function HomePage() {
  const { t } = useLocalization();
  const highlights = [
    t('home.highlight_search'),
    t('home.highlight_inbox'),
    t('home.highlight_quotes'),
  ];

  return (
    <section className="hero-layout">
      <div className="hero-card hero-copy">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1>{t('home.title')}</h1>
        

        <div className="hero-actions">
          <Link to="/search" className="primary-button">
            {t('home.cta_search')}
          </Link>
          <Link to="/auth" className="ghost-button">
            {t('home.cta_register')}
          </Link>
        </div>
      </div>

      <div className="hero-card hero-side">
        <div className="signal-card">
          <span>{t('home.signal_label')}</span>
          <strong>{t('home.signal_title')}</strong>
          <p>{t('home.signal_body')}</p>
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
