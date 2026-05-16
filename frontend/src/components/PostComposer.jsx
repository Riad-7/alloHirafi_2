import { useState } from 'react';

const initialState = {
  title: '',
  description: '',
  city: '',
  price_from: '',
  price_to: '',
  available_at: '',
  image_1: '',
  image_2: '',
};

export default function PostComposer({ onSubmit }) {
  const [form, setForm] = useState(initialState);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await onSubmit({
        ...form,
        images: [form.image_1, form.image_2].filter(Boolean),
      });
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
        <label>
          Image 1
          <input value={form.image_1} onChange={(e) => setForm({ ...form, image_1: e.target.value })} />
        </label>
        <label>
          Image 2
          <input value={form.image_2} onChange={(e) => setForm({ ...form, image_2: e.target.value })} />
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
