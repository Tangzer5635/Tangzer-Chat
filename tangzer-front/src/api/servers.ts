import { api } from "./http";
import type { Channel, DiscoverServer, Invite, Member, MemberRole, Server } from "../types/api";

export interface ServerForm {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    isPublic?: boolean;
    /** Image d'icône envoyée via /api/attachments, ou "" pour la retirer. */
    iconImageId?: string;
}

export const listMyServers = () => api<Server[]>("/api/servers");

export const discoverServers = (query: string) =>
    api<DiscoverServer[]>(`/api/servers/discover?q=${encodeURIComponent(query)}`);

export const createServer = (form: ServerForm) =>
    api<Server>("/api/servers", { method: "POST", body: form });

export const updateServer = (serverId: number, form: ServerForm) =>
    api<Server>(`/api/servers/${serverId}`, { method: "PATCH", body: form });

export const deleteServer = (serverId: number) =>
    api<void>(`/api/servers/${serverId}`, { method: "DELETE" });

export const joinServer = (serverId: number) =>
    api<Server>(`/api/servers/${serverId}/join`, { method: "POST" });

export const leaveServer = (serverId: number) =>
    api<void>(`/api/servers/${serverId}/leave`, { method: "POST" });

// ------------------------------------------------------------------ Membres

export const listMembers = (serverId: number) => api<Member[]>(`/api/servers/${serverId}/members`);

export const kickMember = (serverId: number, userId: number) =>
    api<void>(`/api/servers/${serverId}/members/${userId}`, { method: "DELETE" });

export const changeMemberRole = (serverId: number, userId: number, role: MemberRole) =>
    api<Member>(`/api/servers/${serverId}/members/${userId}`, { method: "PATCH", body: { role } });

// ------------------------------------------------------------------- Salons

export interface ChannelForm {
    name?: string;
    topic?: string;
    type?: "TEXT" | "VOICE";
}

export const createChannel = (serverId: number, form: ChannelForm) =>
    api<Channel>(`/api/servers/${serverId}/channels`, { method: "POST", body: form });

export const updateChannel = (channelId: number, form: ChannelForm) =>
    api<Channel>(`/api/channels/${channelId}`, { method: "PATCH", body: form });

export const deleteChannel = (channelId: number) =>
    api<void>(`/api/channels/${channelId}`, { method: "DELETE" });

// ------------------------------------------------------------- Invitations

export const createInvite = (serverId: number, maxAgeHours: number | null, maxUses: number | null) =>
    api<Invite>(`/api/servers/${serverId}/invites`, { method: "POST", body: { maxAgeHours, maxUses } });
