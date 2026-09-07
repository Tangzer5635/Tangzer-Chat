import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { sendPrivateMessage } from "../services/websocket";
import { useChatContext } from "../context/ChatContext";

const USERS = ["admin", "user", "tanguy"];

export default function DirectMessages() {

    const {currentUser, privateMessages, addPrivateMessage, getDmUnreadCount, markDmRead,} = useChatContext();

    const [searchParams, setSearchParams] = useSearchParams();

    const fromParam = searchParams.get("from");

    const [recipient, setRecipient] = useState<string | null>(fromParam);

    const [content, setContent] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {if (recipient) {markDmRead(recipient);}}, [recipient, privateMessages, markDmRead]);

    useEffect(() => {if (fromParam) {
            setRecipient(fromParam);
            setSearchParams({}, { replace: true });
        }
    }, [fromParam, setSearchParams]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [privateMessages]);

    const handleSend = () => {

        if (!recipient || !content.trim()) return;

        const text = content.trim();

        sendPrivateMessage(recipient, text);

        addPrivateMessage({
            type: "CHAT",
            content: text,
            sender: currentUser,
            recipient,
            roomId: null,
            timestamp: new Date().toISOString(),
        });

        setContent("");
    };

    const isConversationMessage = (msg: typeof privateMessages[number], username: string) =>
        msg.sender === username ||
        (msg.sender === currentUser && msg.recipient === username);

    const conversation = recipient
        ? privateMessages.filter((msg) =>
            isConversationMessage(msg, recipient)
        )
        : [];

    return (
        <div className="page">

            <div className="rooms-layout">

                <div className="rooms-list">

                    <h2>Utilisateurs</h2>

                    {USERS.filter(
                        (u) => u !== currentUser
                    ).map((u) => {
                        const conversationMessages = privateMessages.filter(
                            (msg) => isConversationMessage(msg, u)
                        );

                        const lastMessage =
                            conversationMessages[
                                conversationMessages.length - 1
                            ];

                        const unreadCount = getDmUnreadCount(u);

                        return (
                            <button
                                key={u}
                                onClick={() => setRecipient(u)}
                                className={
                                    recipient === u
                                        ? "room-btn user-conversation active"
                                        : "room-btn user-conversation"
                                }
                            >
                                <div className="user-row">
                                    <span className="user-name">
                                        <span className="user-avatar">👤</span>
                                        {u}
                                    </span>

                                    {unreadCount > 0 && (
                                        <span className="user-unread-badge">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </div>

                                <div className="user-last-message">
                                    {lastMessage
                                        ? lastMessage.content
                                        : "Aucun message"}
                                </div>
                            </button>
                        );
                    })}

                </div>

                <div className="chat-box">

                    <div className="chat-header">
                        <h1>
                            {recipient
                                ? `💬 ${recipient}`
                                : "Choisissez un utilisateur"}
                        </h1>
                    </div>

                    <div className="messages">

                        {conversation.map((msg, i) => (

                            <div
                                key={i}
                                className={
                                    msg.sender === currentUser
                                        ? "message own"
                                        : "message"
                                }
                            >
                                <div className="message-meta">
                                    <strong>{msg.sender}</strong>
                                    <time dateTime={msg.timestamp}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </time>
                                </div>
                                <p>{msg.content}</p>
                            </div>

                        ))}

                        <div ref={bottomRef} />

                    </div>

                    {recipient && (

                        <div className="message-input">

                            <input
                                value={content}
                                onChange={(e) =>
                                    setContent(e.target.value)
                                }
                                placeholder={`Message à ${recipient}...`}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                        handleSend();
                                }}
                            />

                            <button onClick={handleSend}>
                                Envoyer
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}