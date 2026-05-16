import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [body, setBody] = useState('');
  const [quoteState, setQuoteState] = useState({ title: '', description: '', amount: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const data = await apiRequest('/conversations');

        if (!cancelled) {
          setConversations(data.conversations);
          setSelectedId((current) => current ?? data.conversations[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus(err.message);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId],
  );

  const sendMessage = async (event) => {
    event.preventDefault();

    try {
      await apiRequest(`/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: { body },
      });
      setBody('');
      const data = await apiRequest('/conversations');
      setConversations(data.conversations);
    } catch (err) {
      setStatus(err.message);
    }
  };

  const sendQuote = async (event) => {
    event.preventDefault();

    if (!selectedConversation) {
      return;
    }

    try {
      await apiRequest('/quotes', {
        method: 'POST',
        body: {
          conversation_id: selectedConversation.id,
          client_id: selectedConversation.client_id,
          title: quoteState.title,
          description: quoteState.description,
          amount: quoteState.amount,
        },
      });
      setQuoteState({ title: '', description: '', amount: '' });
      setStatus('Devis envoye.');
    } catch (err) {
      setStatus(err.message);
    }
  };

  const updateQuoteStatus = async (statusValue) => {
    if (!selectedConversation?.quotes?.[0]) {
      setStatus('Aucun devis dans cette conversation.');
      return;
    }

    try {
      await apiRequest(`/quotes/${selectedConversation.quotes[0].id}/status`, {
        method: 'PATCH',
        body: { status: statusValue },
      });
      setStatus(`Devis ${statusValue}.`);
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <section className="content-grid inbox-layout">
      <aside className="panel conversation-list">
        <div className="panel-heading">
          <h3>Conversations</h3>
          <p>{conversations.length} fils actifs</p>
        </div>

        {conversations.map((conversation) => {
          const peer = user.id === conversation.client_id ? conversation.artisan : conversation.client;
          return (
            <button
              key={conversation.id}
              className={`conversation-item ${conversation.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(conversation.id)}
            >
              <strong>{peer.name}</strong>
              <span>{peer.city || 'Maroc'}</span>
            </button>
          );
        })}
      </aside>

      <div className="stack-layout">
        <div className="panel messages-panel">
          <div className="panel-heading">
            <h3>Messagerie</h3>
            {status ? <p>{status}</p> : <p>Parle comme dans une vraie relation client-artisan.</p>}
          </div>

          <div className="message-thread">
            {selectedConversation?.messages?.map((message) => (
              <article key={message.id} className={`message-bubble ${message.sender_id === user.id ? 'mine' : ''}`}>
                <strong>{message.sender.name}</strong>
                <p>{message.body}</p>
              </article>
            ))}
          </div>

          <form className="inline-form" onSubmit={sendMessage}>
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ecrire un message..." />
            <button className="primary-button">Envoyer</button>
          </form>
        </div>

        {user.role === 'artisan' ? (
          <form className="panel form-panel" onSubmit={sendQuote}>
            <div className="panel-heading">
              <h3>Envoyer un devis</h3>
              <p>Transforme une conversation en proposition concrete.</p>
            </div>
            <label>
              Titre
              <input value={quoteState.title} onChange={(e) => setQuoteState({ ...quoteState, title: e.target.value })} />
            </label>
            <label>
              Montant
              <input value={quoteState.amount} onChange={(e) => setQuoteState({ ...quoteState, amount: e.target.value })} />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                value={quoteState.description}
                onChange={(e) => setQuoteState({ ...quoteState, description: e.target.value })}
              />
            </label>
            <button className="ghost-button">Envoyer le devis</button>
          </form>
        ) : (
          <div className="panel form-panel">
            <div className="panel-heading">
              <h3>Decision client</h3>
              <p>Accepte ou refuse le devis quand il arrive.</p>
            </div>
            <div className="card-actions">
              <button className="primary-button" onClick={() => updateQuoteStatus('accepted')}>
                Accepter
              </button>
              <button className="ghost-button" onClick={() => updateQuoteStatus('rejected')}>
                Refuser
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
