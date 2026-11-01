/** Types renvoyés par l'API REST et les événements temps réel. */

export interface User {
    id: number;
    username: string;
    displayName: string;
}

/** Statut : les quatre premiers se choisissent, OFFLINE est calculé par le serveur. */
export type UserStatus = "ONLINE" | "IDLE" | "DND" | "INVISIBLE" | "OFFLINE";

/** L'utilisateur connecté, avec ses préférences. */
export interface Me extends User {
    status: UserStatus;
    customStatus: string | null;
}

/** Présence d'un utilisateur telle que les autres la voient. */
export interface Presence {
    userId: number;
    status: UserStatus;
    customStatus: string | null;
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

export interface Attachment {
    id: string;
    /** Adresse de l'image (lisible sans token). */
    url: string;
    fileName: string;
    contentType: string;
    size: number;
    width: number | null;
    height: number | null;
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
    attachments: Attachment[];
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

// ---------------------------------------------------------- Messages privés

/** Une conversation privée vue par l'un des deux participants. */
export interface DmConversation {
    channelId: number;
    otherUser: User;
    lastMessage: MessagePreview | null;
    lastMessageAt: string | null;
    unreadCount: number;
    /** Jusqu'où l'autre a lu (pour afficher « Vu »). */
    otherLastReadMessageId: number | null;
}

/** Nouveau message privé (événement DM_ACTIVITY sur /user/queue/events). */
export interface DmActivity {
    channelId: number;
    participants: User[];
    message: Message;
}
