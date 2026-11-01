import { createContext, useContext } from "react";

import type { DirectMessage, MessageStatus } from "../types/api";

export interface DirectMessagesContextValue {
    messages: DirectMessage[];
    addMessage: (message: DirectMessage) => void;

    unreadCount: number;
    getUnreadCount: (username: string) => number;
    markRead: (username: string) => void;

    statuses: Record<string, MessageStatus["status"]>;
    typingUsers: Record<string, boolean>;
}

export const DirectMessagesContext = createContext<DirectMessagesContextValue | null>(null);

export function useDirectMessages(): DirectMessagesContextValue {
    const ctx = useContext(DirectMessagesContext);
    if (!ctx) {
        throw new Error("useDirectMessages doit être utilisé dans <DirectMessagesProvider>");
    }
    return ctx;
}
