import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

import type { ChatMessage } from "../types/ChatMessage";

export interface Notification {
    id: number;
    text: string;
    link?: string;
}

let notifId = 0;


interface ChatContextValue {
    currentUser: string;
    setCurrentUser: (u: string) => void;
    publicMessages: ChatMessage[];
    addPublicMessage: (m: ChatMessage) => void;
    privateMessages: ChatMessage[];
    addPrivateMessage: (m: ChatMessage) => void;
    roomMessages: ChatMessage[];
    setRoomMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    notifications: Notification[];
    pushNotification: (text: string, link?: string) => void;
    removeNotification: (id: number) => void;
    unreadDmCount: number;
    getDmUnreadCount: (username: string) => number;
    markDmRead: (username: string) => void;
    resetUnreadDm: () => void;
}

const ChatContext =
    createContext<ChatContextValue | null>(null);

export function ChatProvider({children,}: { children: React.ReactNode; }) {

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

    const pushNotification = useCallback(
        (text: string, link?: string) => {
            const id = ++notifId;
            setNotifications((prev) => [...prev, { id, text, link },]);
            setTimeout(() => {setNotifications((prev) => prev.filter((n) => n.id !== id));}, 5000);
        }, []);

    const removeNotification = useCallback(
        (id: number) =>
            setNotifications((prev) =>
                prev.filter((n) => n.id !== id)
            ), []);

    const addPublicMessage = useCallback(
        (m: ChatMessage) =>
            setPublicMessages((prev) => [...prev, m])
        , []);

    const addPrivateMessage = useCallback(
        (m: ChatMessage) =>
            setPrivateMessages((prev) => [...prev, m]),
        []);

    const getDmUnreadCount = useCallback(
        (username: string) => {
            const received = privateMessages.filter(
                (message) => message.sender === username
            ).length;
            const read = dmReadCounts[username] ?? 0;
            return Math.max(0, received - read);
        },
        [privateMessages, dmReadCounts]);

    const markDmRead = useCallback(
        (username: string) => {
            const received = privateMessages.filter(
                (message) => message.sender === username
            ).length;

            setDmReadCounts((prev) => ({
                ...prev,
                [username]: received,
            }));
        },
        [privateMessages]);

    const unreadDmCount = useMemo(() => {
        const senders = new Set(
            privateMessages
                .map((message) => message.sender)
                .filter((sender) => sender !== currentUser)
        );

        let total = 0;
        senders.forEach((sender) => {
            total += getDmUnreadCount(sender);
        });
        return total;
    }, [privateMessages, currentUser, getDmUnreadCount]);

    const resetUnreadDm = useCallback(() => {
        const senders = new Set(
            privateMessages
                .map((message) => message.sender)
                .filter((sender) => sender !== currentUser)
        );

        setDmReadCounts((prev) => {
            const next = { ...prev };
            senders.forEach((sender) => {
                next[sender] = privateMessages.filter(
                    (message) => message.sender === sender
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
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext(): ChatContextValue {

    const ctx = useContext(ChatContext);

    if (!ctx) {
        throw new Error(
            "useChatContext doit être dans <ChatProvider>"
        );
    }

    return ctx;
}