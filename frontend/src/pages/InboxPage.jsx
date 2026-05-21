import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

export default function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [body, setBody] = useState('');
  const [conversationQuery, setConversationQuery] = useState('');
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
  }, [toast]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId],
  );

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const peer = user.id === conversation.client_id ? conversation.artisan : conversation.client;
      const lastMessage = conversation.messages?.[conversation.messages.length - 1];

      return [peer.name, peer.city, formatRole(peer.role), lastMessage?.body]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [conversationQuery, conversations, user.id]);

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

  const openUserProfile = (event, userId) => {
    event.stopPropagation();
    navigate(`/users/${userId}`);
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
  const activeQuote = selectedConversation?.quotes?.[0] ?? null;
  const canSendQuote = user.role === 'artisan' && selectedConversation && (!activeQuote || activeQuote.status !== 'pending');
  const showSidePanel = Boolean(activeQuote || canSendQuote);

  return (
    <section className="inbox-layout">
      <aside className="conversation-list inbox-sidebar">
        <div className="inbox-sidebar-header">
          <div>
            <p className="eyebrow">Inbox</p>
            <h3>Conversations</h3>
          </div>
          <span className="conversation-count">{conversations.length}</span>
        </div>

        <label className="conversation-search" aria-label="Rechercher une conversation">
          <span>⌕</span>
          <input
            value={conversationQuery}
            onChange={(event) => setConversationQuery(event.target.value)}
            placeholder="Rechercher..."
          />
        </label>

        <div className="conversation-list-body">
          {conversations.length === 0 ? (
            <div className="empty-state inbox-empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <p>Aucune conversation</p>
            </div>
          ) : null}

          {conversations.length > 0 && filteredConversations.length === 0 ? (
            <div className="empty-state inbox-empty-state">
              <p>Aucun resultat</p>
            </div>
          ) : null}

          {filteredConversations.map((conversation) => {
            const peer = user.id === conversation.client_id ? conversation.artisan : conversation.client;
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];

            return (
              <button
                key={conversation.id}
                className={`conversation-item ${conversation.id === selectedId ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <span
                  className="avatar-link"
                  onClick={(event) => openUserProfile(event, peer.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      openUserProfile(event, peer.id);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <img src={buildAvatarUrl(peer)} alt={peer.name} className="avatar-sm" />
                </span>
                <div className="conversation-main">
                  <div className="conversation-title-row">
                    <strong>{peer.name}</strong>
                    <span>{lastMessage?.created_at ? formatDateTime(lastMessage.created_at) : 'Maintenant'}</span>
                  </div>
                  <div className="conversation-meta-row">
                    <small>{formatRole(peer.role)}</small>
                    {peer.city ? <small>{peer.city}</small> : null}
                  </div>
                  <p>{lastMessage?.body || 'Commencez la conversation'}</p>
                </div>
                {conversation.unread_messages_count > 0 ? (
                  <span className="notification-badge">{conversation.unread_messages_count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <div className={`stack-layout inbox-main ${showSidePanel ? '' : 'inbox-main-full'}`}>
        <div className="messages-panel">
          <div className="chat-header">
            <div>
              <p className="eyebrow">Messagerie</p>
              <h3>{selectedPeer ? selectedPeer.name : 'Selectionnez une conversation'}</h3>
              <p>{selectedPeer ? `${formatRole(selectedPeer.role)} · ${selectedPeer.city || 'Maroc'}` : 'Vos messages apparaissent ici.'}</p>
            </div>

            {selectedPeer ? (
              <div className="chat-peer-card">
                <Link to={`/users/${selectedPeer.id}`} className="avatar-link">
                  <img src={buildAvatarUrl(selectedPeer)} alt={selectedPeer.name} className="avatar-sm" />
                </Link>
                <div>
                  <strong>{selectedPeer.name}</strong>
                  <small>{selectedPeer.city || 'Maroc'}</small>
                </div>
              </div>
            ) : null}
          </div>

          <div className="message-thread">
            {selectedConversation?.messages?.length ? (
              selectedConversation.messages.map((message) => (
                <article key={message.id} className={`message-bubble ${message.sender_id === user.id ? 'mine' : ''}`}>
                  <Link to={`/users/${message.sender.id}`} className="avatar-link">
                    <img src={buildAvatarUrl(message.sender)} alt={message.sender.name} className="avatar-xs" />
                  </Link>
                  <div className="message-content">
                    <div className="message-author">
                      <strong>{message.sender.name}</strong>
                      <small>{formatDateTime(message.created_at)}</small>
                    </div>
                    <p>{message.body}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state inbox-empty-state thread-empty-state">
                <p>{selectedConversation ? 'Aucun message pour le moment.' : 'Choisissez une conversation pour commencer.'}</p>
              </div>
            )}
          </div>

          <form className="chat-composer" onSubmit={sendMessage}>
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ecrire un message..." />
            <button className="primary-button" disabled={!selectedConversation || !body.trim()}>
              Envoyer
            </button>
          </form>
        </div>

        {showSidePanel ? (
          <div className="inbox-side-panel">
          {activeQuote ? (
            <div className="quote-card">
              <div className="panel-heading quote-header">
                <h3>Devis: {activeQuote.title}</h3>
                <span className={`status-badge status-${activeQuote.status}`}>
                  {activeQuote.status === 'pending' ? 'En attente' : activeQuote.status === 'accepted' ? 'Accepte' : 'Refuse'}
                </span>
              </div>
              <div className="quote-body">
                <p>{activeQuote.description || 'Aucune description detaillee.'}</p>
                <div className="quote-amount-row">
                  <span>Montant propose</span>
                  <strong>{activeQuote.amount} DH</strong>
                </div>
              </div>
              
              {user.role === 'client' && activeQuote.status === 'pending' ? (
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

          {canSendQuote ? (
            <form className="form-panel quote-form-panel" onSubmit={sendQuote}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Proposition</p>
                  <h3>Envoyer un devis</h3>
                </div>
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
        ) : null}
      </div>
    </section>
  );
}
