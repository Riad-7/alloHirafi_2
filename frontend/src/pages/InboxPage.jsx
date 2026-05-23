import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalization } from '../context/LocalizationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiRequest } from '../services/api.js';
import { getEcho } from '../services/realtime.js';
import { formatDateTime } from '../utils/date.js';
import { buildAvatarUrl, formatRole } from '../utils/userPresentation.js';

function sortConversations(conversations) {
  return [...conversations].sort((left, right) => {
    const leftDate = left.last_message_at ?? left.updated_at ?? left.created_at ?? 0;
    const rightDate = right.last_message_at ?? right.updated_at ?? right.created_at ?? 0;

    return new Date(rightDate) - new Date(leftDate);
  });
}

export default function InboxPage() {
  const { user } = useAuth();
  const { locale, t } = useLocalization();
  const navigate = useNavigate();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [body, setBody] = useState('');
  const [conversationQuery, setConversationQuery] = useState('');
  const [quoteState, setQuoteState] = useState({ title: '', description: '', amount: '' });
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const typingResetRef = useRef(null);

  const fetchConversation = useCallback(async (conversationId) => {
    const data = await apiRequest(`/conversations/${conversationId}`);
    return data.conversation;
  }, []);

  const syncConversation = useCallback((incomingConversation) => {
    setConversations((currentConversations) => {
      const nextConversations = [...currentConversations];
      const existingIndex = nextConversations.findIndex((conversation) => conversation.id === incomingConversation.id);

      if (existingIndex >= 0) {
        nextConversations[existingIndex] = incomingConversation;
      } else {
        nextConversations.unshift(incomingConversation);
      }

      return sortConversations(nextConversations);
    });

    setSelectedId((currentSelectedId) => currentSelectedId ?? incomingConversation.id);
  }, []);

  const loadConversations = useCallback(async () => {
    const data = await apiRequest('/conversations');
    const nextConversations = sortConversations(data.conversations || []);

    setConversations(nextConversations);
    setSelectedId((currentSelectedId) => currentSelectedId ?? nextConversations[0]?.id ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const data = await apiRequest('/conversations');

        if (!cancelled) {
          const nextConversations = sortConversations(data.conversations || []);
          setConversations(nextConversations);
          setSelectedId((currentSelectedId) => currentSelectedId ?? nextConversations[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || t('inbox.load_error'));
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const echo = getEcho();

    if (!echo) {
      return undefined;
    }

    const channel = echo.private(`users.${user.id}.conversations`);
    const handleConversationSynced = async (payload) => {
      try {
        const incomingConversation = await fetchConversation(payload.conversation_id);
        syncConversation(incomingConversation);
      } catch {
        // Keep silent here; next interaction can recover state.
      }
    };

    channel.listen('.conversation.synced', handleConversationSynced);

    return () => {
      channel.stopListening('.conversation.synced');
      echo.leave(`private-users.${user.id}.conversations`);
    };
  }, [fetchConversation, syncConversation, user]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  useEffect(() => {
    if (!user || !selectedConversation) {
      setTypingUser(null);
      return undefined;
    }

    const echo = getEcho();

    if (!echo) {
      return undefined;
    }

    const channel = echo.private(`conversations.${selectedConversation.id}`);
    const handleTypingWhisper = (payload) => {
      if (!payload || payload.userId === user.id) {
        return;
      }

      if (payload.isTyping) {
        setTypingUser(payload.name);

        if (typingResetRef.current) {
          window.clearTimeout(typingResetRef.current);
        }

        typingResetRef.current = window.setTimeout(() => {
          setTypingUser(null);
        }, 1800);
      } else {
        setTypingUser(null);
      }
    };

    channel.listenForWhisper('typing', handleTypingWhisper);

    return () => {
      if (typingResetRef.current) {
        window.clearTimeout(typingResetRef.current);
        typingResetRef.current = null;
      }

      setTypingUser(null);
      channel.stopListeningForWhisper('typing');
      echo.leave(`private-conversations.${selectedConversation.id}`);
    };
  }, [selectedConversation, user]);

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const peer = user.id === conversation.client_id ? conversation.artisan : conversation.client;
      const lastMessage = conversation.messages?.[conversation.messages.length - 1];

      return [peer.name, peer.city, formatRole(peer.role, t), lastMessage?.body]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [conversationQuery, conversations, t, user.id]);

  const markConversationRead = useCallback(async (conversationId) => {
    try {
      const data = await apiRequest(`/conversations/${conversationId}/read`, { method: 'PATCH' });

      if (data.conversation) {
        syncConversation(data.conversation);
      }
    } catch {
      // Silent fail to avoid blocking chat interactions.
    }
  }, [syncConversation]);

  useEffect(() => {
    if (selectedConversation?.unread_messages_count > 0) {
      void markConversationRead(selectedConversation.id);
    }
  }, [markConversationRead, selectedConversation]);

  const handleSelectConversation = (conversation) => {
    setSelectedId(conversation.id);
  };

  const openUserProfile = (event, userId) => {
    event.stopPropagation();
    navigate(`/users/${userId}`);
  };

  const sendTypingState = useCallback((isTyping) => {
    if (!selectedConversation) {
      return;
    }

    const echo = getEcho();

    echo?.private(`conversations.${selectedConversation.id}`).whisper('typing', {
      userId: user.id,
      name: user.name,
      isTyping,
    });
  }, [selectedConversation, user.id, user.name]);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!selectedId || !body.trim()) {
      return;
    }

    try {
      sendTypingState(false);

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      const data = await apiRequest(`/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: { body },
      });

      setBody('');

      if (data.conversation) {
        syncConversation(data.conversation);
      } else {
        await loadConversations();
      }
    } catch (error) {
      toast.error(error.message || t('inbox.send_error'));
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
      toast.success(t('inbox.quote_sent'));
    } catch (error) {
      toast.error(error.message || t('inbox.quote_send_error'));
    }
  };

  const updateQuoteStatus = async (statusValue) => {
    if (!selectedConversation?.quotes?.[0]) {
      toast.error(t('inbox.no_quote'));
      return;
    }

    try {
      await apiRequest(`/quotes/${selectedConversation.quotes[0].id}/status`, {
        method: 'PATCH',
        body: { status: statusValue },
      });
      toast.success(t(statusValue === 'accepted' ? 'inbox.quote_accepted' : 'inbox.quote_rejected'));
    } catch (error) {
      toast.error(error.message || t('inbox.quote_update_error'));
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
            <p className="eyebrow">{t('common.inbox')}</p>
            <h3>{t('inbox.conversations')}</h3>
          </div>
          <span className="conversation-count">{conversations.length}</span>
        </div>

        <label className="conversation-search" aria-label={t('inbox.search_label')}>
          <span>⌕</span>
          <input
            value={conversationQuery}
            onChange={(event) => setConversationQuery(event.target.value)}
            placeholder={t('inbox.search_placeholder')}
          />
        </label>

        <div className="conversation-list-body">
          {conversations.length === 0 ? (
            <div className="empty-state inbox-empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <p>{t('inbox.empty_conversations')}</p>
            </div>
          ) : null}

          {conversations.length > 0 && filteredConversations.length === 0 ? (
            <div className="empty-state inbox-empty-state">
              <p>{t('inbox.empty_search')}</p>
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
                    <span>{lastMessage?.created_at ? formatDateTime(lastMessage.created_at, locale) : t('common.now')}</span>
                  </div>
                  <div className="conversation-meta-row">
                    <small>{formatRole(peer.role, t)}</small>
                    {peer.city ? <small>{peer.city}</small> : null}
                  </div>
                  <p>{lastMessage?.body || t('inbox.start_conversation')}</p>
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
              <p className="eyebrow">{t('common.inbox')}</p>
              <h3>{selectedPeer ? selectedPeer.name : t('inbox.select_conversation')}</h3>
              <p>{selectedPeer ? `${formatRole(selectedPeer.role, t)} · ${selectedPeer.city || t('common.morocco')}` : t('inbox.messages_here')}</p>
            </div>

            {selectedPeer ? (
              <div className="chat-peer-card">
                <Link to={`/users/${selectedPeer.id}`} className="avatar-link">
                  <img src={buildAvatarUrl(selectedPeer)} alt={selectedPeer.name} className="avatar-sm" />
                </Link>
                <div>
                  <strong>{selectedPeer.name}</strong>
                  <small>{selectedPeer.city || t('common.morocco')}</small>
                </div>
              </div>
            ) : null}
          </div>

          <div className="message-thread">
            {selectedConversation?.messages?.length ? (
              <>
                {selectedConversation.messages.map((message) => (
                  <article key={message.id} className={`message-bubble ${message.sender_id === user.id ? 'mine' : ''}`}>
                    <Link to={`/users/${message.sender.id}`} className="avatar-link">
                      <img src={buildAvatarUrl(message.sender)} alt={message.sender.name} className="avatar-xs" />
                    </Link>
                    <div className="message-content">
                      <div className="message-author">
                        <strong>{message.sender.name}</strong>
                        <small>{formatDateTime(message.created_at, locale)}</small>
                      </div>
                      <p>{message.body}</p>
                    </div>
                  </article>
                ))}
                {typingUser ? (
                  <article className="message-bubble typing-bubble">
                    <div className="message-content">
                      <div className="message-author">
                        <strong>{typingUser}</strong>
                      </div>
                      <div className="typing-indicator" aria-label={`${typingUser} is typing`}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </article>
                ) : null}
              </>
            ) : (
              <div className="empty-state inbox-empty-state thread-empty-state">
                <p>{selectedConversation ? t('inbox.empty_messages') : t('inbox.choose_to_start')}</p>
              </div>
            )}
          </div>

          <form className="chat-composer" onSubmit={sendMessage}>
            <input
              value={body}
              onChange={(event) => {
                const nextValue = event.target.value;
                setBody(nextValue);

                if (!selectedConversation) {
                  return;
                }

                sendTypingState(nextValue.trim().length > 0);

                if (typingTimeoutRef.current) {
                  window.clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = window.setTimeout(() => {
                  sendTypingState(false);
                }, 1200);
              }}
              placeholder={t('inbox.message_placeholder')}
            />
            <button className="primary-button" disabled={!selectedConversation || !body.trim()}>
              {t('common.send')}
            </button>
          </form>
        </div>

        {showSidePanel ? (
          <div className="inbox-side-panel">
            {activeQuote ? (
              <div className="quote-card">
                <div className="panel-heading quote-header">
                  <h3>{t('inbox.quote_title_prefix')}: {activeQuote.title}</h3>
                  <span className={`status-badge status-${activeQuote.status}`}>
                    {t(`inbox.quote_status_${activeQuote.status}`)}
                  </span>
                </div>
                <div className="quote-body">
                  <p>{activeQuote.description || t('inbox.quote_no_description')}</p>
                  <div className="quote-amount-row">
                    <span>{t('inbox.quote_amount')}</span>
                    <strong>{activeQuote.amount} DH</strong>
                  </div>
                </div>

                {user.role === 'client' && activeQuote.status === 'pending' ? (
                  <div className="quote-actions">
                    <button className="primary-button" onClick={() => updateQuoteStatus('accepted')}>
                      {t('inbox.accept_quote')}
                    </button>
                    <button className="ghost-button" onClick={() => updateQuoteStatus('rejected')}>
                      {t('inbox.reject_quote')}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {canSendQuote ? (
              <form className="form-panel quote-form-panel" onSubmit={sendQuote}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{t('inbox.proposal')}</p>
                    <h3>{t('inbox.send_quote')}</h3>
                  </div>
                </div>
                <label>
                  {t('post.field_title')}
                  <input value={quoteState.title} onChange={(event) => setQuoteState({ ...quoteState, title: event.target.value })} required />
                </label>
                <label>
                  {t('inbox.amount_dh')}
                  <input type="number" min="1" value={quoteState.amount} onChange={(event) => setQuoteState({ ...quoteState, amount: event.target.value })} required />
                </label>
                <label>
                  {t('post.field_description')}
                  <textarea
                    rows="3"
                    value={quoteState.description}
                    onChange={(event) => setQuoteState({ ...quoteState, description: event.target.value })}
                  />
                </label>
                <button className="primary-button">{t('inbox.send_quote_button')}</button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
