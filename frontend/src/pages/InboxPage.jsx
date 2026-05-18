import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function InboxPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [body, setBody] = useState('');
  const [quoteState, setQuoteState] = useState({ title: '', description: '', amount: '' });

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
          toast.error(err.message || 'Erreur de chargement des conversations');
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
      await loadConversations();
    } catch (err) {
      toast.error(err.message || 'Erreur d\'envoi');
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
      toast.success('Devis envoye.');
      await loadConversations();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'envoi du devis');
    }
  };

  const updateQuoteStatus = async (statusValue) => {
    if (!selectedConversation?.quotes?.[0]) {
      toast.error('Aucun devis dans cette conversation.');
      return;
    }

    try {
      await apiRequest(`/quotes/${selectedConversation.quotes[0].id}/status`, {
        method: 'PATCH',
        body: { status: statusValue },
      });
      toast.success(`Devis ${statusValue === 'accepted' ? 'accepte' : 'refuse'}.`);
      await loadConversations();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise a jour du devis');
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

        {conversations.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '0.8rem' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p>Aucune conversation</p>
          </div>
        ) : (
          conversations.map((conversation) => {
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
          })
        )}
      </aside>

      <div className="stack-layout">
        <div className="panel messages-panel">
          <div className="panel-heading">
            <div>
              <h3>Messagerie</h3>
              <p>Un chat clair pour convertir en devis rapidement.</p>
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

        {selectedConversation?.quotes?.[0] ? (
          <div className="panel quote-card">
            <div className="panel-heading quote-header">
              <h3>Devis: {selectedConversation.quotes[0].title}</h3>
              <span className={`status-badge status-${selectedConversation.quotes[0].status}`}>
                {selectedConversation.quotes[0].status === 'pending' ? 'En attente' : selectedConversation.quotes[0].status === 'accepted' ? 'Accepte' : 'Refuse'}
              </span>
            </div>
            <div className="quote-body">
              <p>{selectedConversation.quotes[0].description || 'Aucune description detaillee.'}</p>
              <div className="quote-amount-row">
                <span>Montant propose</span>
                <strong>{selectedConversation.quotes[0].amount} DH</strong>
              </div>
            </div>
            
            {user.role === 'client' && selectedConversation.quotes[0].status === 'pending' ? (
              <div className="quote-actions">
                <button className="primary-button" onClick={() => updateQuoteStatus('accepted')}>
                  Accepter le devis
                </button>
                <button className="ghost-button" onClick={() => updateQuoteStatus('rejected')}>
                  Refuser
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {user.role === 'artisan' && (!selectedConversation?.quotes?.[0] || selectedConversation.quotes[0].status !== 'pending') ? (
          <form className="panel form-panel" onSubmit={sendQuote}>
            <div className="panel-heading">
              <h3>Envoyer un devis</h3>
              <p>Transforme la discussion en proposition professionnelle.</p>
            </div>
            <label>
              Titre
              <input value={quoteState.title} onChange={(e) => setQuoteState({ ...quoteState, title: e.target.value })} required />
            </label>
            <label>
              Montant (DH)
              <input type="number" min="1" value={quoteState.amount} onChange={(e) => setQuoteState({ ...quoteState, amount: e.target.value })} required />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                value={quoteState.description}
                onChange={(e) => setQuoteState({ ...quoteState, description: e.target.value })}
              />
            </label>
            <button className="primary-button">Envoyer le devis</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
