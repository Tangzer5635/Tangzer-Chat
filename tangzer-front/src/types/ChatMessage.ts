export type MessageType = "CHAT" | "JOIN" | "LEAVE";

export type MessageDeliveryStatus = "SENT" | "DELIVERED" | "READ";

export interface ChatMessage {
    type: MessageType;
    content: string;
    sender: string;
    roomId: string | null;
    timestamp: string;
    messageId?: string;
    recipient?: string | null;
}

export interface MessageStatus {
    messageId: string;
    status: MessageDeliveryStatus;
    username: string;
}

export interface TypingStatus {
    username: string;
    recipient: string;
    typing: boolean;
}
