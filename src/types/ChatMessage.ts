export type MessageType = "CHAT" | "JOIN" | "LEAVE";

export interface ChatMessage {
    type: MessageType;
    content: string;
    sender: string;
    roomId: string | null;
    timestamp: string;
    // Présent pour les messages envoyés localement en DM.
    recipient?: string | null;
}
