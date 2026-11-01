import { describe, expect, it } from "vitest";

import type { Channel, Server } from "../types/api";
import { initialServersState, serverEventToAction, serversReducer, type ServersState } from "./serversReducer";

const channel = (id: number, position: number, serverId = 1): Channel => ({
    id, serverId, name: `salon-${id}`, topic: null, type: "TEXT", position,
});

const server = (id: number, overrides: Partial<Server> = {}): Server => ({
    id,
    name: `Serveur ${id}`,
    description: null,
    icon: null,
    iconUrl: null,
    color: "#5865f2",
    isPublic: false,
    isDefault: false,
    ownerId: 1,
    memberCount: 3,
    myRole: "MEMBER",
    channels: [channel(10, 0, id)],
    ...overrides,
});

const loaded = (...servers: Server[]): ServersState =>
    serversReducer(initialServersState, { type: "loaded", servers });

describe("serversReducer", () => {
    it("ajoute un nouveau serveur ou remplace celui qui existe", () => {
        let state = loaded(server(1));
        state = serversReducer(state, { type: "serverUpserted", server: server(2) });
        state = serversReducer(state, { type: "serverUpserted", server: server(1, { name: "Renommé" }) });

        expect(state.servers.map((s) => s.name)).toEqual(["Renommé", "Serveur 2"]);
    });

    it("garde mon rôle et les salons quand les infos du serveur changent", () => {
        const state = serversReducer(loaded(server(1, { myRole: "OWNER" })), {
            type: "serverInfoUpdated",
            server: server(1, { name: "Nouveau nom", icon: "🔥", iconUrl: "/api/attachments/x", myRole: null, channels: [] }),
        });

        expect(state.servers[0]).toMatchObject({
            name: "Nouveau nom", icon: "🔥", iconUrl: "/api/attachments/x", myRole: "OWNER",
        });
        expect(state.servers[0].channels).toHaveLength(1);
    });

    it("insère et trie les salons par position", () => {
        let state = loaded(server(1));
        state = serversReducer(state, { type: "channelUpserted", channel: channel(12, 2) });
        state = serversReducer(state, { type: "channelUpserted", channel: channel(11, 1) });
        state = serversReducer(state, { type: "channelUpserted", channel: { ...channel(12, 2), name: "renommé" } });

        expect(state.servers[0].channels.map((c) => c.id)).toEqual([10, 11, 12]);
        expect(state.servers[0].channels[2].name).toBe("renommé");
    });

    it("retire un salon ou un serveur", () => {
        let state = loaded(server(1), server(2));
        state = serversReducer(state, { type: "channelRemoved", serverId: 1, channelId: 10 });
        state = serversReducer(state, { type: "serverRemoved", serverId: 2 });

        expect(state.servers).toHaveLength(1);
        expect(state.servers[0].channels).toEqual([]);
    });

    it("ne descend jamais sous zéro membre", () => {
        const state = serversReducer(loaded(server(1, { memberCount: 0 })), {
            type: "memberCountChanged", serverId: 1, delta: -1,
        });

        expect(state.servers[0].memberCount).toBe(0);
    });
});

describe("serverEventToAction", () => {
    it("traduit les événements du serveur", () => {
        expect(serverEventToAction(1, { type: "MEMBER_JOINED", payload: {} }, 7))
            .toEqual({ type: "memberCountChanged", serverId: 1, delta: 1 });
        expect(serverEventToAction(1, { type: "CHANNEL_DELETED", payload: { serverId: 1, channelId: 4 } }, 7))
            .toEqual({ type: "channelRemoved", serverId: 1, channelId: 4 });
        expect(serverEventToAction(1, { type: "SERVER_DELETED", payload: { serverId: 1 } }, 7))
            .toEqual({ type: "serverRemoved", serverId: 1 });
    });

    it("ne retient un changement de rôle que s'il me concerne", () => {
        const promotion = (userId: number) => ({
            type: "MEMBER_UPDATED",
            payload: { user: { id: userId, username: "x", displayName: "X" }, role: "ADMIN", joinedAt: "" },
        });

        expect(serverEventToAction(1, promotion(7), 7)).toEqual({ type: "myRoleChanged", serverId: 1, role: "ADMIN" });
        expect(serverEventToAction(1, promotion(8), 7)).toBeNull();
    });

    it("ignore les événements inconnus", () => {
        expect(serverEventToAction(1, { type: "AUTRE", payload: null }, 7)).toBeNull();
    });
});
