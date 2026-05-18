import { useState } from 'react';

const initialState = {
  title: '',
  description: '',
  city: '',
  price_from: '',
  price_to: '',
  available_at: '',
  imageFiles: [],
};

export default function PostComposer({ onSubmit }) {
  const [form, setForm] = useState(initialState);
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
      setForm(initialState);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <h3>Publier une annonce</h3>
        <p>Ajoute une offre claire avec prix, ville et visuels.</p>
      </div>

      <div className="form-grid">
        <label>
          Titre
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          Ville
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        </label>
        <label>
          Prix min
          <input value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} />
        </label>
        <label>
          Prix max
          <input value={form.price_to} onChange={(e) => setForm({ ...form, price_to: e.target.value })} />
        </label>
        <label>
          Disponible a
          <input
            type="datetime-local"
            value={form.available_at}
            onChange={(e) => setForm({ ...form, available_at: e.target.value })}
          />
        </label>
        <label className="profile-full-row">
          Images (max 5)
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={(e) => setForm({ ...form, imageFiles: Array.from(e.target.files).slice(0, 5) })} 
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows="4"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </label>

      <button className="primary-button" disabled={busy} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
        {busy ? (
          <>
            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            Publication...
          </>
        ) : 'Publier'}
      </button>
    </form>
  );
}
