import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [body, setBody] = useState('');
  const [quoteState, setQuoteState] = useState({ title: '', description: '', amount: '' });
  const [status, setStatus] = useState('');

  const loadConversations = useCallback(async () => {
    const data = await apiRequest('/conversations');

    setConversations(data.conversations);
    setSelectedId((current) => current ?? data.conversations[0]?.id ?? null);
  }, []);

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

  const markConversationRead = useCallback(async (conversationId) => {
    try {
      await apiRequest(`/conversations/${conversationId}/read`, { method: 'PATCH' });
      await loadConversations();
    } catch {
      // Silent fail to avoid blocking chat interactions.
    }
  }, [loadConversations]);

  const handleSelectConversation = async (conversation) => {
    setSelectedId(conversation.id);

    if (conversation.unread_messages_count > 0) {
      await markConversationRead(conversation.id);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!selectedId || !body.trim()) {
      return;
    }

    try {
      await apiRequest(`/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: { body },
      });
      setBody('');
      setStatus('');
      await loadConversations();
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
      await loadConversations();
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
      await loadConversations();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const selectedPeer = selectedConversation
    ? user.id === selectedConversation.client_id
      ? selectedConversation.artisan
      : selectedConversation.client
    : null;

  return (
    <section className="content-grid inbox-layout">
      <aside className="panel conversation-list">
        <div className="panel-heading">
          <h3>Conversations</h3>
          <p>{conversations.length} fils actifs</p>
        </div>

        {conversations.map((conversation) => {
          const peer = user.id === conversation.client_id ? conversation.artisan : conversation.client;
          const lastMessage = conversation.messages?.[conversation.messages.length - 1];

          return (
            <button
              key={conversation.id}
              className={`conversation-item ${conversation.id === selectedId ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="conversation-row">
                <img src={buildAvatarUrl(peer)} alt={peer.name} className="avatar-sm" />
                <div>
                  <strong>{peer.name}</strong>
                  <span>{formatRole(peer.role)}</span>
                </div>
              </div>

              <small>{lastMessage?.body || 'Commencez la conversation'}</small>

              <div className="conversation-row">
                <span>{lastMessage?.created_at ? formatDateTime(lastMessage.created_at) : 'Maintenant'}</span>
                {conversation.unread_messages_count > 0 ? (
                  <span className="notification-badge">{conversation.unread_messages_count}</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </aside>

      <div className="stack-layout">
        <div className="panel messages-panel">
          <div className="panel-heading">
            <div>
              <h3>Messagerie</h3>
              <p>{status || 'Un chat clair pour convertir en devis rapidement.'}</p>
            </div>

            {selectedPeer ? (
              <div className="chat-peer-card">
                <img src={buildAvatarUrl(selectedPeer)} alt={selectedPeer.name} className="avatar-sm" />
                <div>
                  <strong>{selectedPeer.name}</strong>
                  <small>{selectedPeer.city || 'Maroc'}</small>
                </div>
              </div>
            ) : null}
          </div>

          <div className="message-thread">
            {selectedConversation?.messages?.map((message) => (
              <article key={message.id} className={`message-bubble ${message.sender_id === user.id ? 'mine' : ''}`}>
                <div className="message-author">
                  <img src={buildAvatarUrl(message.sender)} alt={message.sender.name} className="avatar-xs" />
                  <strong>{message.sender.name}</strong>
                  <small>{formatDateTime(message.created_at)}</small>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </div>

          <form className="inline-form" onSubmit={sendMessage}>
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ecrire un message..." />
            <button className="primary-button" disabled={!selectedConversation || !body.trim()}>
              Envoyer
            </button>
          </form>
        </div>

        {user.role === 'artisan' ? (
          <form className="panel form-panel" onSubmit={sendQuote}>
            <div className="panel-heading">
              <h3>Envoyer un devis</h3>
              <p>Transforme la discussion en proposition professionnelle.</p>
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
              <p>Accepte ou refuse rapidement le dernier devis recu.</p>
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
