import { createContext, useContext } from "react";

import type {
    ChatMessage,
    MessageStatus,
    TypingStatus,
} from "../types/ChatMessage";

export interface Notification {
    id: number;
    text: string;
    link?: string;
}

export interface ChatContextValue {
    currentUser: string;

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

    messageStatuses: Record<string, MessageStatus["status"]>;
    updateMessageStatus: (status: MessageStatus) => void;

    typingUsers: Record<string, boolean>;
    updateTypingStatus: (status: TypingStatus) => void;
}

export const ChatContext =
    createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
    const ctx = useContext(ChatContext);

    if (!ctx) {
        throw new Error(
            "useChatContext doit être dans <ChatProvider>"
        );
    }

    return ctx;
}
