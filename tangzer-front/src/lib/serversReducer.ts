import type { Channel, Member, MemberRole, RealtimeEvent, Server } from "../types/api";

/**
 * État de la liste « mes serveurs » et sa mise à jour à partir
 * des réponses REST et des événements temps réel.
 */

export interface ServersState {
    loaded: boolean;
    servers: Server[];
}

export type ServersAction =
    | { type: "loaded"; servers: Server[] }
    | { type: "serverUpserted"; server: Server }
    | { type: "serverInfoUpdated"; server: Server }
    | { type: "serverRemoved"; serverId: number }
    | { type: "channelUpserted"; channel: Channel }
    | { type: "channelRemoved"; serverId: number; channelId: number }
    | { type: "memberCountChanged"; serverId: number; delta: number }
    | { type: "myRoleChanged"; serverId: number; role: MemberRole };

export const initialServersState: ServersState = { loaded: false, servers: [] };

function sortChannels(channels: Channel[]): Channel[] {
    return [...channels].sort((a, b) => a.position - b.position || a.id - b.id);
}

function updateServer(state: ServersState, serverId: number, update: (server: Server) => Server): ServersState {
    return {
        ...state,
        servers: state.servers.map((server) => (server.id === serverId ? update(server) : server)),
    };
}

export function serversReducer(state: ServersState, action: ServersAction): ServersState {
    switch (action.type) {
        case "loaded":
            return { loaded: true, servers: action.servers };

        case "serverUpserted": {
            const exists = state.servers.some((s) => s.id === action.server.id);
            return {
                ...state,
                servers: exists
                    ? state.servers.map((s) => (s.id === action.server.id ? action.server : s))
                    : [...state.servers, action.server],
            };
        }

        case "serverInfoUpdated":
            // L'événement diffusé à tous ne contient pas « mon rôle » : on le garde.
            return updateServer(state, action.server.id, (server) => ({
                ...server,
                name: action.server.name,
                description: action.server.description,
                icon: action.server.icon,
                iconUrl: action.server.iconUrl,
                color: action.server.color,
                isPublic: action.server.isPublic,
            }));

        case "serverRemoved":
            return { ...state, servers: state.servers.filter((s) => s.id !== action.serverId) };

        case "channelUpserted":
            return updateServer(state, action.channel.serverId, (server) => ({
                ...server,
                channels: sortChannels([
                    ...server.channels.filter((c) => c.id !== action.channel.id),
                    action.channel,
                ]),
            }));

        case "channelRemoved":
            return updateServer(state, action.serverId, (server) => ({
                ...server,
                channels: server.channels.filter((c) => c.id !== action.channelId),
            }));

        case "memberCountChanged":
            return updateServer(state, action.serverId, (server) => ({
                ...server,
                memberCount: Math.max(0, server.memberCount + action.delta),
            }));

        case "myRoleChanged":
            return updateServer(state, action.serverId, (server) => ({ ...server, myRole: action.role }));
    }
}

/** Traduit un événement de /topic/servers/{id} en action (ou null s'il ne change rien ici). */
export function serverEventToAction(serverId: number, event: RealtimeEvent, myUserId: number): ServersAction | null {
    switch (event.type) {
        case "SERVER_UPDATED":
            return { type: "serverInfoUpdated", server: event.payload as Server };
        case "SERVER_DELETED":
            return { type: "serverRemoved", serverId };
        case "CHANNEL_CREATED":
        case "CHANNEL_UPDATED":
            return { type: "channelUpserted", channel: event.payload as Channel };
        case "CHANNEL_DELETED":
            return { type: "channelRemoved", serverId, channelId: (event.payload as { channelId: number }).channelId };
        case "MEMBER_JOINED":
            return { type: "memberCountChanged", serverId, delta: 1 };
        case "MEMBER_LEFT":
            return { type: "memberCountChanged", serverId, delta: -1 };
        case "MEMBER_UPDATED": {
            const member = event.payload as Member;
            return member.user.id === myUserId ? { type: "myRoleChanged", serverId, role: member.role } : null;
        }
        default:
            return null;
    }
}
