import { useState } from 'react';
import { useLocalization } from '../context/LocalizationContext.jsx';

const defaultState = {
  title: '',
  description: '',
  city: '',
  price_from: '',
  price_to: '',
  available_at: '',
  imageFiles: [],
};

export default function PostComposer({ onSubmit, initialData, onCancel }) {
  const { t } = useLocalization();
  const [form, setForm] = useState(initialData ? {
    title: initialData.title || '',
    description: initialData.description || '',
    city: initialData.city || '',
    price_from: initialData.price_from || '',
    price_to: initialData.price_to || '',
    available_at: initialData.available_at ? initialData.available_at.slice(0, 16) : '',
    imageFiles: [],
  } : defaultState);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('city', form.city);
      if (form.price_from) formData.append('price_from', form.price_from);
      if (form.price_to) formData.append('price_to', form.price_to);
      if (form.available_at) formData.append('available_at', form.available_at);

      form.imageFiles.forEach((file) => {
        formData.append('images[]', file);
      });

      await onSubmit(formData);
      if (!initialData) {
        setForm(defaultState);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <h3>{initialData ? t('post.edit_title') : t('post.create_title')}</h3>
        <p>{initialData ? t('post.edit_description') : t('post.create_description')}</p>
      </div>

      <div className="form-grid">
        <label>
          {t('post.field_title')}
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          {t('auth.city')}
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </label>
        <label>
          {t('post.price_min')}
          <input value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} />
        </label>
        <label>
          {t('post.price_max')}
          <input value={form.price_to} onChange={(e) => setForm({ ...form, price_to: e.target.value })} />
        </label>
        <label>
          {t('post.available_at')}
          <input
            type="datetime-local"
            value={form.available_at}
            onChange={(e) => setForm({ ...form, available_at: e.target.value })}
          />
        </label>
        <label className="profile-full-row">
          {t('post.images')}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setForm({ ...form, imageFiles: Array.from(e.target.files).slice(0, 5) })}
          />
        </label>
      </div>

      <label>
        {t('post.field_description')}
        <textarea
          rows="4"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </label>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="primary-button" disabled={busy} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          {busy ? (
            <>
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
              {initialData ? t('post.saving') : t('post.publishing')}
            </>
          ) : (initialData ? t('post.update_button') : t('post.publish_button'))}
        </button>
        {onCancel && (
          <button type="button" className="ghost-button" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
