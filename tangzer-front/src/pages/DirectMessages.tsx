import {useEffect, useRef, useState,} from "react";

import { useSearchParams } from "react-router-dom";

import {sendPrivateMessage, sendReadReceipt, sendTyping,} from "../services/websocket";

import { useChatContext } from "../context/ChatContext";

import type { ChatMessage } from "../types/ChatMessage";

import  {v4 as uuidv4} from 'uuid';

const USERS = ["admin", "user", "tanguy", "pigloo"];

export default function DirectMessages() {
    const {
        currentUser,
        privateMessages,
        addPrivateMessage,
        getDmUnreadCount,
        markDmRead,
        messageStatuses,
        typingUsers,
    } = useChatContext();

    const [searchParams, setSearchParams] =
        useSearchParams();

    const fromParam = searchParams.get("from");

    const [recipient, setRecipient] =
        useState<string | null>(fromParam);

    const [content, setContent] = useState("");

    const bottomRef =
        useRef<HTMLDivElement>(null);

    const typingTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (recipient) {
            markDmRead(recipient);
        }
    }, [
        recipient,
        privateMessages,
        markDmRead,
    ]);

    useEffect(() => {
        if (fromParam) {
            setRecipient(fromParam);
            setSearchParams({}, { replace: true });
        }
    }, [fromParam, setSearchParams]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [privateMessages, recipient]);

    useEffect(() => {
        if (!recipient) {
            return;
        }

        privateMessages
            .filter(
                (msg) =>
                    msg.sender === recipient &&
                    msg.messageId
            )
            .forEach((msg) => {
                sendReadReceipt(
                    msg.messageId!,
                    msg.sender
                );
            });
    }, [recipient, privateMessages]);

    const stopTyping = (user: string) => {
        sendTyping(user, false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    const handleTyping = (
        value: string
    ) => {
        setContent(value);

        if (!recipient) {
            return;
        }

        sendTyping(recipient, true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current =
            setTimeout(() => {
                sendTyping(recipient, false);
            }, 900);
    };

    const handleSend = () => {
        if (!recipient || !content.trim()) {
            return;
        }

        const text = content.trim();
        const messageId = uuidv4();

        sendPrivateMessage(
            recipient,
            text,
            messageId
        );

        // Le message apparaît immédiatement avec l'état "envoyé".
        addPrivateMessage({
            type: "CHAT",
            content: text,
            sender: currentUser,
            recipient,
            roomId: null,
            timestamp: new Date().toISOString(),
            messageId,
        });

        stopTyping(recipient);
        setContent("");
    };

    const isConversationMessage = (
        msg: ChatMessage,
        username: string
    ) =>
        msg.sender === username ||
        (
            msg.sender === currentUser &&
            msg.recipient === username
        );

    const conversation = recipient
        ? privateMessages.filter((msg) =>
            isConversationMessage(
                msg,
                recipient
            )
        )
        : [];

    const isTyping =
        recipient
            ? typingUsers[recipient] === true
            : false;

    const renderStatus = (msg: ChatMessage) => {
        if (msg.sender !== currentUser || !msg.messageId) {
            return null;
        }

        const status =
            messageStatuses[msg.messageId] ?? "SENT";

        if (status === "READ") {
            return (
                <span
                    className="message-status read"
                    title="Lu"
                >
                    ✓✓
                </span>
            );
        }

        if (status === "DELIVERED") {
            return (
                <span
                    className="message-status delivered"
                    title="Distribué"
                >
                    ✓✓
                </span>
            );
        }

        return (
            <span
                className="message-status sent"
                title="Envoyé"
            >
                ✓
            </span>
        );
    };

    return (
        <div className="page">
            <div className="rooms-layout">

                <div className="rooms-list">
                    <h2>Utilisateurs</h2>

                    {USERS
                        .filter(
                            (u) =>
                                u !== currentUser
                        )
                        .map((u) => {
                            const conversationMessages =
                                privateMessages.filter(
                                    (msg) =>
                                        isConversationMessage(
                                            msg,
                                            u
                                        )
                                );

                            const lastMessage =
                                conversationMessages[
                                    conversationMessages.length - 1
                                ];

                            const unreadCount =
                                getDmUnreadCount(u);

                            return (
                                <button
                                    key={u}
                                    onClick={() => {
                                        setRecipient(u);
                                        markDmRead(u);
                                    }}
                                    className={
                                        recipient === u
                                            ? "room-btn user-conversation active"
                                            : "room-btn user-conversation"
                                    }
                                >
                                    <div className="user-row">
                                        <span className="user-name">
                                            <span className="user-avatar">
                                                👤
                                            </span>
                                            {u}
                                        </span>

                                        {unreadCount > 0 && (
                                            <span className="user-unread-badge">
                                                {unreadCount > 99
                                                    ? "99+"
                                                    : unreadCount}
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

                        {conversation.map(
                            (msg, i) => (
                                <div
                                    key={
                                        msg.messageId ?? i
                                    }
                                    className={
                                        msg.sender === currentUser
                                            ? "message own"
                                            : "message"
                                    }
                                >
                                    <div className="message-meta">
                                        <strong>
                                            {msg.sender}
                                        </strong>

                                        <time
                                            dateTime={
                                                msg.timestamp
                                            }
                                        >
                                            {new Date(
                                                msg.timestamp
                                            ).toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </time>

                                        {renderStatus(msg)}
                                    </div>

                                    <p>{msg.content}</p>
                                </div>
                            )
                        )}

                        {isTyping && (
                            <div className="typing-indicator">
                                <span className="typing-dots">
                                    <i></i>
                                    <i></i>
                                    <i></i>
                                </span>

                                <span>
                                    {recipient} est en train d’écrire…
                                </span>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {recipient && (
                        <div className="message-input">

                            <input
                                value={content}
                                onChange={(e) =>
                                    handleTyping(
                                        e.target.value
                                    )
                                }
                                onBlur={() =>
                                    stopTyping(recipient)
                                }
                                placeholder={`Message à ${recipient}...`}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter"
                                    ) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />

                            <button
                                onClick={handleSend}
                            >
                                Envoyer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
