import {
    useCallback,
    useMemo,
    useState,
} from "react";

import type {
    ChatMessage,
    MessageStatus,
    TypingStatus,
} from "../types/ChatMessage";

import { ChatContext, type Notification } from "./chatContext";

let notifId = 0;

export function ChatProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [currentUser, setCurrentUser] = useState("");

    const [publicMessages, setPublicMessages] =
        useState<ChatMessage[]>([]);

    const [privateMessages, setPrivateMessages] =
        useState<ChatMessage[]>([]);

    const [roomMessages, setRoomMessages] =
        useState<ChatMessage[]>([]);

    const [notifications, setNotifications] =
        useState<Notification[]>([]);

    const [dmReadCounts, setDmReadCounts] =
        useState<Record<string, number>>({});

    const [messageStatuses, setMessageStatuses] =
        useState<Record<string, MessageStatus["status"]>>({});

    const [typingUsers, setTypingUsers] =
        useState<Record<string, boolean>>({});

    const pushNotification = useCallback(
        (text: string, link?: string) => {
            const id = ++notifId;

            setNotifications((prev) => [
                ...prev,
                { id, text, link },
            ]);

            setTimeout(() => {
                setNotifications((prev) =>
                    prev.filter((n) => n.id !== id)
                );
            }, 5000);
        },
        []
    );

    const removeNotification = useCallback(
        (id: number) =>
            setNotifications((prev) =>
                prev.filter((n) => n.id !== id)
            ),
        []
    );

    const addPublicMessage = useCallback(
        (m: ChatMessage) =>
            setPublicMessages((prev) => [...prev, m]),
        []
    );

    const addPrivateMessage = useCallback(
        (m: ChatMessage) =>
            setPrivateMessages((prev) => {
                if (
                    m.messageId &&
                    prev.some(
                        (existing) =>
                            existing.messageId === m.messageId
                    )
                ) {
                    return prev.map((existing) =>
                        existing.messageId === m.messageId
                            ? { ...existing, ...m }
                            : existing
                    );
                }

                return [...prev, m];
            }),
        []
    );

    const updateMessageStatus = useCallback(
        (status: MessageStatus) => {
            setMessageStatuses((prev) => ({
                ...prev,
                [status.messageId]: status.status,
            }));
        },
        []
    );

    const updateTypingStatus = useCallback(
        (status: TypingStatus) => {
            setTypingUsers((prev) => ({
                ...prev,
                [status.username]: status.typing,
            }));
        },
        []
    );

    const getDmUnreadCount = useCallback(
        (username: string) => {
            const received = privateMessages.filter(
                (message) =>
                    message.sender === username
            ).length;

            const read = dmReadCounts[username] ?? 0;

            return Math.max(0, received - read);
        },
        [privateMessages, dmReadCounts]
    );

    const markDmRead = useCallback(
        (username: string) => {
            const received = privateMessages.filter(
                (message) =>
                    message.sender === username
            ).length;

            setDmReadCounts((prev) => ({
                ...prev,
                [username]: received,
            }));
        },
        [privateMessages]
    );

    const unreadDmCount = useMemo(() => {
        const senders = new Set(
            privateMessages
                .map((message) => message.sender)
                .filter(
                    (sender) => sender !== currentUser
                )
        );

        let total = 0;

        senders.forEach((sender) => {
            total += getDmUnreadCount(sender);
        });

        return total;
    }, [
        privateMessages,
        currentUser,
        getDmUnreadCount,
    ]);

    const resetUnreadDm = useCallback(() => {
        const senders = new Set(
            privateMessages
                .map((message) => message.sender)
                .filter(
                    (sender) => sender !== currentUser
                )
        );

        setDmReadCounts((prev) => {
            const next = { ...prev };

            senders.forEach((sender) => {
                next[sender] =
                    privateMessages.filter(
                        (message) =>
                            message.sender === sender
                    ).length;
            });

            return next;
        });
    }, [privateMessages, currentUser]);

    return (
        <ChatContext.Provider
            value={{
                currentUser,
                setCurrentUser,

                publicMessages,
                addPublicMessage,

                privateMessages,
                addPrivateMessage,

                roomMessages,
                setRoomMessages,

                notifications,
                pushNotification,
                removeNotification,

                unreadDmCount,
                getDmUnreadCount,
                markDmRead,
                resetUnreadDm,

                messageStatuses,
                updateMessageStatus,

                typingUsers,
                updateTypingStatus,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}
