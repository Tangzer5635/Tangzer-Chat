import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { useToasts } from "../context/toasts";
import { formatTime, groupMessages } from "../lib/messages";
import { useSubscription } from "../realtime/hooks";
import { publish } from "../realtime/stomp";
import type { Channel, ChannelMessage, RealtimeEvent } from "../types/api";
import Avatar from "./Avatar";

interface ChannelViewProps {
    channel: Channel;
    membersVisible: boolean;
    onToggleMembers: () => void;
}

/** Fil de discussion d'un salon + zone de saisie. */
export default function ChannelView({ channel, membersVisible, onToggleMembers }: ChannelViewProps) {
    const { pushToast } = useToasts();
    const [messages, setMessages] = useState<ChannelMessage[]>([]);
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useSubscription<RealtimeEvent>(`/topic/channels/${channel.id}`, (event) => {
        if (event.type === "MESSAGE_CREATED") {
            setMessages((current) => [...current, event.payload as ChannelMessage]);
        }
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = () => {
        const content = draft.trim();
        if (!content) {
            return;
        }
        if (!publish(`/app/channels/${channel.id}/send`, { content })) {
            pushToast("Pas de connexion au serveur : message non envoyé.", { tone: "error" });
            return;
        }
        setDraft("");
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Entrée envoie, Maj+Entrée va à la ligne.
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

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

            <div className="messages">
                <div className="channel-welcome">
                    <div className="channel-welcome-icon">#</div>
                    <h2>Bienvenue dans #{channel.name} !</h2>
                    <p>{channel.topic ?? "C'est le début de ce salon. Dis bonjour 👋"}</p>
                </div>

                {groupMessages(messages).map((group) => (
                    <article key={group.id} className="message-group">
                        <Avatar user={group.author} />
                        <div className="message-group-body">
                            <div className="message-meta">
                                <strong>{group.author.displayName}</strong>
                                <time dateTime={group.messages[0].createdAt}>{formatTime(group.messages[0].createdAt)}</time>
                            </div>
                            {group.messages.map((message) => (
                                <p key={message.id} className="message-content">{message.content}</p>
                            ))}
                        </div>
                    </article>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="composer">
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Envoyer un message dans #${channel.name}`}
                    rows={1}
                    maxLength={2000}
                />
            </div>
        </section>
    );
}
