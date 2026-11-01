import { useCallback, useEffect, useReducer, useState } from "react";

import * as messagesApi from "../../api/messages";
import { useAuth } from "../../context/auth";
import { useToasts } from "../../context/toasts";
import { useUnread } from "../../context/unread";
import { randomId } from "../../lib/id";
import { typingLabel } from "../../lib/messageRows";
import { initialMessagesState, messagesReducer } from "../../lib/messagesReducer";
import { useSubscription } from "../../realtime/hooks";
import { publish } from "../../realtime/stomp";
import type { Channel, Message, Reaction, RealtimeEvent, User } from "../../types/api";
import Composer from "./Composer";
import MessageItem from "./MessageItem";
import MessageList from "./MessageList";

const TYPING_DISPLAY_MS = 6000;

/** Identifiants négatifs pour les messages pas encore enregistrés par le serveur. */
let lastTemporaryId = 0;
const nextTemporaryId = () => --lastTemporaryId;

interface ChannelViewProps {
    channel: Channel;
    canModerate: boolean;
    membersVisible: boolean;
    onToggleMembers: () => void;
}

/** Un salon : historique, temps réel, envoi, réponses, édition, réactions. */
export default function ChannelView({ channel, canModerate, membersVisible, onToggleMembers }: ChannelViewProps) {
    const { user } = useAuth();
    const me = user!;
    const { pushToast } = useToasts();
    const { setActiveChannel, markRead } = useUnread();

    const [state, dispatch] = useReducer(messagesReducer, initialMessagesState);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [typing, setTyping] = useState<Record<number, { name: string; until: number }>>({});
    const [visible, setVisible] = useState(() => document.visibilityState === "visible");

    // ------------------------------------------------------------ Chargement

    useEffect(() => {
        let cancelled = false;
        messagesApi.fetchHistory(channel.id)
            .then((messages) => !cancelled && dispatch({
                type: "historyLoaded", messages, hasMore: messages.length === messagesApi.PAGE_SIZE,
            }))
            .catch((err) => !cancelled && pushToast(err instanceof Error ? err.message : "Historique indisponible.", { tone: "error" }));
        return () => {
            cancelled = true;
        };
    }, [channel.id, pushToast]);

    const loadOlder = useCallback(() => {
        const oldest = state.messages.find((m) => m.id > 0);
        if (!oldest) {
            return;
        }
        dispatch({ type: "olderLoading" });
        messagesApi.fetchHistory(channel.id, oldest.id)
            .then((messages) => dispatch({ type: "olderLoaded", messages, hasMore: messages.length === messagesApi.PAGE_SIZE }))
            .catch(() => dispatch({ type: "olderLoaded", messages: [], hasMore: false }));
    }, [channel.id, state.messages]);

    // ------------------------------------------------------------ Temps réel

    useSubscription<RealtimeEvent>(`/topic/channels/${channel.id}`, (event) => {
        switch (event.type) {
            case "MESSAGE_CREATED": {
                const message = event.payload as Message;
                dispatch({ type: "received", message });
                setTyping((current) => {
                    const next = { ...current };
                    delete next[message.author.id];
                    return next;
                });
                break;
            }
            case "MESSAGE_UPDATED":
                dispatch({ type: "updated", message: event.payload as Message });
                break;
            case "MESSAGE_DELETED":
                dispatch({ type: "deleted", messageId: (event.payload as { messageId: number }).messageId });
                break;
            case "REACTIONS_UPDATED": {
                const { messageId, reactions } = event.payload as { messageId: number; reactions: Reaction[] };
                dispatch({ type: "reactionsUpdated", messageId, reactions });
                break;
            }
            case "TYPING": {
                const { user: typist } = event.payload as { user: User };
                if (typist.id !== me.id) {
                    setTyping((current) => ({ ...current, [typist.id]: { name: typist.displayName, until: Date.now() + TYPING_DISPLAY_MS } }));
                }
                break;
            }
        }
    });

    // Les indicateurs de saisie disparaissent seuls au bout de quelques secondes.
    const typingCount = Object.keys(typing).length;
    useEffect(() => {
        if (typingCount === 0) {
            return;
        }
        const timer = setInterval(() => {
            const now = Date.now();
            setTyping((current) => Object.fromEntries(Object.entries(current).filter(([, t]) => t.until > now)));
        }, 1000);
        return () => clearInterval(timer);
    }, [typingCount]);

    // ------------------------------------------------------------ Lecture

    useEffect(() => {
        setActiveChannel(channel.id);
        const onVisibility = () => setVisible(document.visibilityState === "visible");
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            setActiveChannel(null);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [channel.id, setActiveChannel]);

    const lastConfirmedId = state.messages.filter((m) => m.id > 0).at(-1)?.id ?? null;
    useEffect(() => {
        if (state.loaded && visible && lastConfirmedId) {
            markRead(channel.id, lastConfirmedId);
        }
    }, [channel.id, state.loaded, visible, lastConfirmedId, markRead]);

    // ------------------------------------------------------------ Actions

    const send = async (content: string) => {
        const nonce = randomId();
        dispatch({
            type: "pendingAdded",
            message: {
                id: nextTemporaryId(),
                channelId: channel.id,
                author: me,
                content,
                createdAt: new Date().toISOString(),
                editedAt: null,
                replyTo: replyTo && { id: replyTo.id, author: replyTo.author, content: replyTo.content },
                reactions: [],
                nonce,
                pending: true,
            },
        });
        const replyToId = replyTo?.id ?? null;
        setReplyTo(null);
        try {
            dispatch({ type: "received", message: await messagesApi.postMessage(channel.id, content, replyToId, nonce) });
        } catch (err) {
            dispatch({ type: "failed", nonce });
            pushToast(err instanceof Error ? err.message : "Message non envoyé.", { tone: "error" });
        }
    };

    const retry = (message: Message) => {
        dispatch({ type: "deleted", messageId: message.id });
        void send(message.content);
    };

    const saveEdit = async (message: Message, content: string) => {
        setEditingId(null);
        if (content.trim() === message.content) {
            return;
        }
        try {
            dispatch({ type: "updated", message: await messagesApi.editMessage(message.id, content) });
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Modification impossible.", { tone: "error" });
        }
    };

    const remove = async (message: Message) => {
        if (!window.confirm("Supprimer ce message ?")) {
            return;
        }
        try {
            await messagesApi.deleteMessage(message.id);
            dispatch({ type: "deleted", messageId: message.id });
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Suppression impossible.", { tone: "error" });
        }
    };

    const react = async (message: Message, emoji: string) => {
        try {
            dispatch({ type: "reactionsUpdated", messageId: message.id, reactions: await messagesApi.toggleReaction(message.id, emoji) });
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Réaction impossible.", { tone: "error" });
        }
    };

    const editLast = () => {
        const last = [...state.messages].reverse().find((m) => m.author.id === me.id && m.id > 0);
        if (last) {
            setEditingId(last.id);
        }
    };

    const jumpTo = (messageId: number) => {
        const el = document.getElementById(`message-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("flash");
            setTimeout(() => el.classList.remove("flash"), 1500);
        } else {
            pushToast("Ce message est plus ancien : remonte dans l'historique pour le voir.");
        }
    };

    const typingText = typingLabel(Object.values(typing).map((t) => t.name));

    return (
        <section className="chat">
            <header className="chat-header">
                <span className="chat-header-hash">#</span>
                <h1>{channel.name}</h1>
                {channel.topic && <span className="chat-header-topic">{channel.topic}</span>}
                <span className="spacer" />
                <button
                    className={membersVisible ? "icon-button active" : "icon-button"}
                    onClick={onToggleMembers}
                    title={membersVisible ? "Masquer les membres" : "Afficher les membres"}
                >
                    👥
                </button>
            </header>

            {!state.loaded ? (
                <div className="page-loading">Chargement des messages…</div>
            ) : (
                <MessageList
                    messages={state.messages}
                    hasMore={state.hasMore}
                    loadingOlder={state.loadingOlder}
                    onLoadOlder={loadOlder}
                    welcome={
                        <div className="channel-welcome">
                            <div className="channel-welcome-icon">#</div>
                            <h2>Bienvenue dans #{channel.name} !</h2>
                            <p>{channel.topic ?? "C'est le début de ce salon. Dis bonjour 👋"}</p>
                        </div>
                    }
                    renderMessage={(message, showHeader) => (
                        <MessageItem
                            message={message}
                            showHeader={showHeader}
                            me={me}
                            canModerate={canModerate}
                            editing={editingId === message.id}
                            onStartEdit={() => setEditingId(message.id)}
                            onCancelEdit={() => setEditingId(null)}
                            onSaveEdit={(content) => saveEdit(message, content)}
                            onReply={() => setReplyTo(message)}
                            onDelete={() => remove(message)}
                            onReact={(emoji) => react(message, emoji)}
                            onRetry={() => retry(message)}
                            onJumpTo={jumpTo}
                        />
                    )}
                />
            )}

            <div className="typing-line">
                {typingText && (
                    <>
                        <span className="typing-dots"><i /><i /><i /></span>
                        <span>{typingText}</span>
                    </>
                )}
            </div>

            <Composer
                placeholder={`Envoyer un message dans #${channel.name}`}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={send}
                onTyping={() => publish(`/app/channels/${channel.id}/typing`)}
                onEditLast={editLast}
            />
        </section>
    );
}
