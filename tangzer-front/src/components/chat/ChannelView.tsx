import { useCallback, useEffect, useReducer, useState, type DragEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import * as messagesApi from "../../api/messages";
import { useAuth } from "../../context/auth";
import { useDms } from "../../context/dms";
import { useToasts } from "../../context/toasts";
import { useUnread } from "../../context/unread";
import { randomId } from "../../lib/id";
import { typingLabel } from "../../lib/messageRows";
import { initialMessagesState, messagesReducer } from "../../lib/messagesReducer";
import { useSubscription } from "../../realtime/hooks";
import { publish } from "../../realtime/stomp";
import type { Attachment, Message, Reaction, RealtimeEvent, User } from "../../types/api";
import Modal from "../Modal";
import ProfileCard from "../ProfileCard";
import Composer from "./Composer";
import MessageItem from "./MessageItem";
import MessageList from "./MessageList";
import { useUploads } from "./useUploads";

const TYPING_DISPLAY_MS = 6000;

/** Identifiants négatifs pour les messages pas encore enregistrés par le serveur. */
let lastTemporaryId = 0;
const nextTemporaryId = () => --lastTemporaryId;

interface ChannelViewProps {
    channelId: number;
    /** Contenu de la barre du haut (nom du salon ou de la personne…). */
    header: ReactNode;
    /** Affiché tout en haut du fil, une fois tout l'historique chargé. */
    welcome: ReactNode;
    placeholder: string;
    canModerate: boolean;
    /** Affiché sous l'en-tête, au-dessus du fil (ex. : l'appel en cours). */
    banner?: ReactNode;
    /** Conversation privée : l'autre participant, pour l'accusé « Vu ». */
    partner?: User;
    partnerReadId?: number | null;
}

/**
 * Un salon ou une conversation privée : historique, temps réel, envoi,
 * réponses, édition, réactions, saisie et lecture.
 */
export default function ChannelView(props: ChannelViewProps) {
    const { channelId, header, welcome, placeholder, canModerate, partner } = props;
    const { user } = useAuth();
    const me = user!;
    const { pushToast } = useToasts();
    const { setActiveChannel, markRead } = useUnread();

    const [state, dispatch] = useReducer(messagesReducer, initialMessagesState);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [typing, setTyping] = useState<Record<number, { name: string; until: number }>>({});
    const [visible, setVisible] = useState(() => document.visibilityState === "visible");
    const [partnerReadId, setPartnerReadId] = useState(props.partnerReadId ?? 0);
    const [dragging, setDragging] = useState(false);
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const { openWith } = useDms();
    const navigate = useNavigate();
    const showError = useCallback((message: string) => pushToast(message, { tone: "error" }), [pushToast]);
    const uploads = useUploads(showError);

    // ------------------------------------------------------------ Chargement

    useEffect(() => {
        let cancelled = false;
        messagesApi.fetchHistory(channelId)
            .then((messages) => !cancelled && dispatch({
                type: "historyLoaded", messages, hasMore: messages.length === messagesApi.PAGE_SIZE,
            }))
            .catch((err) => !cancelled && pushToast(err instanceof Error ? err.message : "Historique indisponible.", { tone: "error" }));
        return () => {
            cancelled = true;
        };
    }, [channelId, pushToast]);

    const loadOlder = useCallback(() => {
        const oldest = state.messages.find((m) => m.id > 0);
        if (!oldest) {
            return;
        }
        dispatch({ type: "olderLoading" });
        messagesApi.fetchHistory(channelId, oldest.id)
            .then((messages) => dispatch({ type: "olderLoaded", messages, hasMore: messages.length === messagesApi.PAGE_SIZE }))
            .catch(() => dispatch({ type: "olderLoaded", messages: [], hasMore: false }));
    }, [channelId, state.messages]);

    // ------------------------------------------------------------ Temps réel

    useSubscription<RealtimeEvent>(`/topic/channels/${channelId}`, (event) => {
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
            case "READ": {
                const read = event.payload as { userId: number; lastReadMessageId: number };
                if (partner && read.userId === partner.id) {
                    setPartnerReadId((current) => Math.max(current, read.lastReadMessageId));
                }
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
        setActiveChannel(channelId);
        const onVisibility = () => setVisible(document.visibilityState === "visible");
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            setActiveChannel(null);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [channelId, setActiveChannel]);

    const lastConfirmedId = state.messages.filter((m) => m.id > 0).at(-1)?.id ?? null;
    useEffect(() => {
        if (state.loaded && visible && lastConfirmedId) {
            markRead(channelId, lastConfirmedId);
        }
    }, [channelId, state.loaded, visible, lastConfirmedId, markRead]);

    // ------------------------------------------------------------ Actions

    const send = async (content: string, attachments: Attachment[] = uploads.attachments) => {
        const nonce = randomId();
        uploads.clear();
        dispatch({
            type: "pendingAdded",
            message: {
                id: nextTemporaryId(),
                channelId: channelId,
                author: me,
                content,
                createdAt: new Date().toISOString(),
                editedAt: null,
                replyTo: replyTo && { id: replyTo.id, author: replyTo.author, content: replyTo.content },
                reactions: [],
                attachments,
                nonce,
                pending: true,
            },
        });
        const replyToId = replyTo?.id ?? null;
        setReplyTo(null);
        try {
            dispatch({
                type: "received",
                message: await messagesApi.postMessage(channelId, content, replyToId, nonce, attachments.map((a) => a.id)),
            });
        } catch (err) {
            dispatch({ type: "failed", nonce });
            pushToast(err instanceof Error ? err.message : "Message non envoyé.", { tone: "error" });
        }
    };

    const retry = (message: Message) => {
        dispatch({ type: "deleted", messageId: message.id });
        void send(message.content, message.attachments);
    };

    // Glisser-déposer des images n'importe où sur le salon.
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
    const onDragOver = (e: DragEvent) => {
        if (hasFiles(e)) {
            e.preventDefault();
            setDragging(true);
        }
    };
    const onDrop = (e: DragEvent) => {
        if (hasFiles(e)) {
            e.preventDefault();
            setDragging(false);
            uploads.addFiles(Array.from(e.dataTransfer.files));
        }
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

    // « Vu » sous mon dernier message lu par l'autre participant.
    const seenMessageId = partner
        ? state.messages.filter((m) => m.author.id === me.id && m.id > 0 && m.id <= partnerReadId).at(-1)?.id
        : undefined;

    const typingText = typingLabel(Object.values(typing).map((t) => t.name));

    return (
        <section
            className="chat"
            onDragOver={onDragOver}
            onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
            onDrop={onDrop}
        >
            {dragging && (
                <div className="drop-overlay" onDragLeave={() => setDragging(false)}>
                    <div>📷<strong>Dépose tes images ici</strong><span>PNG, JPEG, GIF ou WEBP · 10 Mo max · 4 par message</span></div>
                </div>
            )}
            <header className="chat-header">{header}</header>
            {props.banner}

            {!state.loaded ? (
                <div className="page-loading">Chargement des messages…</div>
            ) : (
                <MessageList
                    messages={state.messages}
                    hasMore={state.hasMore}
                    loadingOlder={state.loadingOlder}
                    onLoadOlder={loadOlder}
                    welcome={welcome}
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
                            seen={message.id === seenMessageId}
                            onOpenProfile={setProfileUser}
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

            {profileUser && (
                <Modal title="Profil" onClose={() => setProfileUser(null)}>
                    <ProfileCard user={profileUser}>
                        {profileUser.id !== me.id && (
                            <button
                                className="button-primary"
                                onClick={() => openWith(profileUser.id)
                                    .then((conversation) => {
                                        setProfileUser(null);
                                        navigate(`/app/dm/${conversation.channelId}`);
                                    })
                                    .catch((err) => pushToast(err instanceof Error ? err.message : "Conversation impossible.", { tone: "error" }))}
                            >
                                Envoyer un message
                            </button>
                        )}
                    </ProfileCard>
                </Modal>
            )}

            <Composer
                placeholder={placeholder}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={(content) => send(content)}
                onTyping={() => publish(`/app/channels/${channelId}/typing`)}
                onEditLast={editLast}
                uploads={uploads.items}
                uploading={uploads.uploading}
                onAddFiles={uploads.addFiles}
                onRemoveUpload={uploads.remove}
            />
        </section>
    );
}
