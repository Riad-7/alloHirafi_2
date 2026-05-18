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

      <button className="primary-button" disabled={busy}>
        {busy ? 'Publication...' : 'Publier'}
      </button>
    </form>
  );
}
