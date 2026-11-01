import { api } from "./http";
import type { Message, Reaction, UnreadEntry } from "../types/api";

export const PAGE_SIZE = 50;

export const fetchHistory = (channelId: number, before?: number) =>
    api<Message[]>(`/api/channels/${channelId}/messages?limit=${PAGE_SIZE}${before ? `&before=${before}` : ""}`);

export const postMessage = (
    channelId: number,
    content: string,
    replyToId: number | null,
    nonce: string,
    attachmentIds: string[] = [],
) => api<Message>(`/api/channels/${channelId}/messages`, {
    method: "POST",
    body: { content, replyToId, nonce, attachmentIds },
});

export const editMessage = (messageId: number, content: string) =>
    api<Message>(`/api/messages/${messageId}`, { method: "PATCH", body: { content } });

export const deleteMessage = (messageId: number) =>
    api<void>(`/api/messages/${messageId}`, { method: "DELETE" });

export const toggleReaction = (messageId: number, emoji: string) =>
    api<Reaction[]>(`/api/messages/${messageId}/reactions`, { method: "POST", body: { emoji } });

export const markChannelRead = (channelId: number, messageId: number) =>
    api<void>(`/api/channels/${channelId}/read`, { method: "POST", body: { messageId } });

export const fetchUnread = () => api<UnreadEntry[]>("/api/unread");
