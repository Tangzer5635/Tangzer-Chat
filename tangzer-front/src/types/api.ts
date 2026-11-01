/** Types renvoyés par l'API REST et les événements temps réel. */

export interface User {
    id: number;
    username: string;
    displayName: string;
}

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export type ChannelType = "TEXT";

export interface Channel {
    id: number;
    serverId: number;
    name: string;
    topic: string | null;
    type: ChannelType;
    position: number;
}

export interface Server {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string;
    isPublic: boolean;
    isDefault: boolean;
    ownerId: number;
    memberCount: number;
    /** null dans les événements diffusés à tous les membres. */
    myRole: MemberRole | null;
    channels: Channel[];
}

export interface DiscoverServer {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string;
    memberCount: number;
    joined: boolean;
}

export interface Member {
    user: User;
    role: MemberRole;
    joinedAt: string;
}

export interface Invite {
    code: string;
    serverId: number;
    expiresAt: string | null;
    maxUses: number | null;
    uses: number;
}

export interface InvitePreview {
    code: string;
    server: DiscoverServer;
    inviter: User;
    expiresAt: string | null;
    valid: boolean;
}

export interface Reaction {
    emoji: string;
    userIds: number[];
}

export interface MessagePreview {
    id: number;
    author: User;
    content: string;
}

export interface Message {
    id: number;
    channelId: number;
    author: User;
    content: string;
    createdAt: string;
    editedAt: string | null;
    replyTo: MessagePreview | null;
    reactions: Reaction[];
    /** Identifiant temporaire choisi à l'envoi, pour retrouver le message « en cours ». */
    nonce?: string | null;
    /** Côté front uniquement : envoi en cours / échoué. */
    pending?: boolean;
    failed?: boolean;
}

export interface UnreadEntry {
    channelId: number;
    serverId: number | null;
    count: number;
}

export interface ChannelActivity {
    serverId: number;
    channelId: number;
    messageId: number;
    authorId: number;
    mentions: string[];
}

/** Enveloppe de tous les événements STOMP : {"type": "...", "payload": {...}}. */
export interface RealtimeEvent<T = unknown> {
    type: string;
    payload: T;
}

// ------------------------------------------------- Messages privés (temporaire)

export type MessageDeliveryStatus = "SENT" | "DELIVERED" | "READ";

export interface DirectMessage {
    type: "CHAT" | "JOIN" | "LEAVE";
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
