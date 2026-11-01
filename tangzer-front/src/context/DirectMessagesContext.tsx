import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { useSubscription } from "../realtime/hooks";
import type { DirectMessage, MessageStatus, TypingStatus } from "../types/api";
import { useAuth } from "./auth";
import { DirectMessagesContext, type DirectMessagesContextValue } from "./directMessages";
import { useToasts } from "./toasts";

/**
 * Messages privés reçus pendant la session (en mémoire, réécrits en phase 4),
 * avec accusés « distribué / lu » et indicateur de saisie.
 */
export function DirectMessagesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { pushToast } = useToasts();
    const location = useLocation();
    const me = user?.username ?? "";

    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [readCounts, setReadCounts] = useState<Record<string, number>>({});
    const [statuses, setStatuses] = useState<Record<string, MessageStatus["status"]>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

    const addMessage = useCallback((message: DirectMessage) => {
        setMessages((current) => {
            if (message.messageId && current.some((m) => m.messageId === message.messageId)) {
                return current.map((m) => (m.messageId === message.messageId ? { ...m, ...message } : m));
            }
            return [...current, message];
        });
    }, []);

    useSubscription<DirectMessage>("/user/queue/private", (message) => {
        addMessage({ ...message, timestamp: message.timestamp ?? new Date().toISOString() });
        const viewing = location.pathname === "/app/dm"
            && new URLSearchParams(location.search).get("with") === message.sender;
        if (!viewing) {
            pushToast(`💬 Message de ${message.sender}`, { link: `/app/dm?with=${message.sender}` });
        }
    });

    useSubscription<MessageStatus>("/user/queue/private-status", (status) => {
        setStatuses((current) => ({ ...current, [status.messageId]: status.status }));
    });

    useSubscription<TypingStatus>("/user/queue/private-typing", (status) => {
        setTypingUsers((current) => ({ ...current, [status.username]: status.typing }));
    });

    const getUnreadCount = useCallback((username: string) => {
        const received = messages.filter((m) => m.sender === username).length;
        return Math.max(0, received - (readCounts[username] ?? 0));
    }, [messages, readCounts]);

    const markRead = useCallback((username: string) => {
        const received = messages.filter((m) => m.sender === username).length;
        setReadCounts((current) => (current[username] === received ? current : { ...current, [username]: received }));
    }, [messages]);

    const unreadCount = useMemo(() => {
        const senders = new Set(messages.map((m) => m.sender).filter((sender) => sender !== me));
        let total = 0;
        senders.forEach((sender) => {
            total += getUnreadCount(sender);
        });
        return total;
    }, [messages, me, getUnreadCount]);

    const value = useMemo<DirectMessagesContextValue>(() => ({
        messages, addMessage, unreadCount, getUnreadCount, markRead, statuses, typingUsers,
    }), [messages, addMessage, unreadCount, getUnreadCount, markRead, statuses, typingUsers]);

    return <DirectMessagesContext.Provider value={value}>{children}</DirectMessagesContext.Provider>;
}
