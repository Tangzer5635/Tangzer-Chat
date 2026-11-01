import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { listUsers } from "../api/users";
import Avatar from "../components/Avatar";
import UserPanel from "../components/UserPanel";
import { useAuth } from "../context/auth";
import { useDirectMessages } from "../context/directMessages";
import { randomId } from "../lib/id";
import { formatTime } from "../lib/messageRows";
import { sendPrivateMessage, sendReadReceipt, sendTyping } from "../realtime/directMessages";
import type { DirectMessage, User } from "../types/api";

/**
 * /app/dm?with=username : messages privés en temps réel.
 * (Version en mémoire : l'historique persistant arrive en phase 4.)
 */
export default function DirectMessages() {
    const { user } = useAuth();
    const me = user?.username ?? "";
    const { messages, addMessage, getUnreadCount, markRead, statuses, typingUsers } = useDirectMessages();

    const [searchParams, setSearchParams] = useSearchParams();
    const recipient = searchParams.get("with");

    const [users, setUsers] = useState<User[]>([]);
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const acknowledged = useRef(new Set<string>());

    useEffect(() => {
        listUsers().then(setUsers).catch(() => setUsers([]));
    }, []);

    const isInConversation = (message: DirectMessage, other: string) =>
        message.sender === other || (message.sender === me && message.recipient === other);

    const conversation = recipient ? messages.filter((m) => isInConversation(m, recipient)) : [];

    // Conversation ouverte : tout est lu, et on envoie un accusé de lecture une seule fois par message.
    useEffect(() => {
        if (!recipient) {
            return;
        }
        markRead(recipient);
        messages
            .filter((m) => m.sender === recipient && m.messageId && !acknowledged.current.has(m.messageId))
            .forEach((m) => {
                acknowledged.current.add(m.messageId!);
                sendReadReceipt(m.messageId!, m.sender);
            });
    }, [recipient, messages, markRead]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation.length, recipient]);

    const displayNameOf = (username: string) => users.find((u) => u.username === username)?.displayName ?? username;
    const userOf = (username: string) => users.find((u) => u.username === username);

    const stopTyping = () => {
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
            if (recipient) {
                sendTyping(recipient, false);
            }
        }
    };

    const onDraftChange = (value: string) => {
        setDraft(value);
        if (!recipient) {
            return;
        }
        // On ne prévient qu'au début de la saisie, puis on arrête après 1,5 s sans frappe.
        if (!typingTimeout.current) {
            sendTyping(recipient, true);
        } else {
            clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = setTimeout(stopTyping, 1500);
    };

    const send = () => {
        const content = draft.trim();
        if (!recipient || !content) {
            return;
        }
        const messageId = randomId();
        if (!sendPrivateMessage(recipient, content, messageId)) {
            return;
        }
        addMessage({
            type: "CHAT",
            content,
            sender: me,
            recipient,
            roomId: null,
            timestamp: new Date().toISOString(),
            messageId,
        });
        stopTyping();
        setDraft("");
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const statusOf = (message: DirectMessage) => {
        if (message.sender !== me || !message.messageId) {
            return null;
        }
        const status = statuses[message.messageId] ?? "SENT";
        const labels = { SENT: ["✓", "Envoyé"], DELIVERED: ["✓✓", "Distribué"], READ: ["✓✓", "Lu"] } as const;
        const [icon, label] = labels[status];
        return <span className={`message-status ${status.toLowerCase()}`} title={label}>{icon}</span>;
    };

    const otherUsers = users.filter((u) => u.username !== me);

    return (
        <>
            <aside className="sidebar">
                <div className="sidebar-header static">
                    <span className="sidebar-title">Messages privés</span>
                </div>
                <div className="sidebar-scroll">
                    {otherUsers.map((other) => {
                        const last = messages.filter((m) => isInConversation(m, other.username)).at(-1);
                        const unread = getUnreadCount(other.username);
                        return (
                            <button
                                key={other.id}
                                className={recipient === other.username ? "dm-item active" : "dm-item"}
                                onClick={() => setSearchParams({ with: other.username })}
                            >
                                <Avatar user={other} size={32} />
                                <span className="dm-item-text">
                                    <strong>{other.displayName}</strong>
                                    <small>{last ? last.content : `@${other.username}`}</small>
                                </span>
                                {unread > 0 && <span className="badge">{unread > 99 ? "99+" : unread}</span>}
                            </button>
                        );
                    })}
                </div>
                <UserPanel />
            </aside>

            <section className="chat">
                {recipient ? (
                    <>
                        <header className="chat-header">
                            <span className="chat-header-hash">@</span>
                            <h1>{displayNameOf(recipient)}</h1>
                        </header>

                        <div className="messages">
                            <div className="channel-welcome">
                                {userOf(recipient) && <Avatar user={userOf(recipient)!} size={80} />}
                                <h2>{displayNameOf(recipient)}</h2>
                                <p>C'est le début de ta conversation avec @{recipient}.</p>
                            </div>

                            {conversation.map((message, index) => (
                                <article key={message.messageId ?? index} className="message-group">
                                    <Avatar user={userOf(message.sender) ?? { id: 0, displayName: message.sender }} />
                                    <div className="message-group-body">
                                        <div className="message-meta">
                                            <strong>{displayNameOf(message.sender)}</strong>
                                            <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
                                            {statusOf(message)}
                                        </div>
                                        <p className="message-content">{message.content}</p>
                                    </div>
                                </article>
                            ))}

                            {typingUsers[recipient] && (
                                <div className="typing-indicator">
                                    <span className="typing-dots"><i /><i /><i /></span>
                                    {displayNameOf(recipient)} est en train d'écrire…
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="composer">
                            <textarea
                                value={draft}
                                onChange={(e) => onDraftChange(e.target.value)}
                                onKeyDown={onKeyDown}
                                onBlur={stopTyping}
                                placeholder={`Envoyer un message à @${recipient}`}
                                rows={1}
                                maxLength={2000}
                            />
                        </div>
                    </>
                ) : (
                    <div className="page-empty">
                        <h2>Tes messages privés</h2>
                        <p>Choisis quelqu'un dans la liste pour discuter en privé.</p>
                    </div>
                )}
            </section>
        </>
    );
}
