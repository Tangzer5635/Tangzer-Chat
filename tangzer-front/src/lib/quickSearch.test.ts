import { describe, expect, it } from "vitest";

import type { Channel, Server } from "../types/api";
import { normalize, searchMyChannels } from "./quickSearch";

const channel = (id: number, name: string): Channel => ({ id, serverId: 1, name, topic: null, type: "TEXT", position: id });
const server = (id: number, name: string, channels: Channel[]): Server => ({
    id, name, description: null, icon: null, iconUrl: null, color: "#6b2f73", isPublic: false, isDefault: false,
    ownerId: 1, memberCount: 1, myRole: "MEMBER", channels,
});

const servers = [
    server(1, "Préau", [channel(1, "général"), channel(2, "dev")]),
    server(2, "Club photo", [channel(3, "galerie"), channel(4, "general-photo")]),
];

describe("normalize", () => {
    it("ignore la casse et les accents", () => {
        expect(normalize("  Général ")).toBe("general");
        expect(normalize("PRÉAU")).toBe("preau");
    });
});

describe("searchMyChannels", () => {
    it("trouve les salons sans tenir compte des accents", () => {
        expect(searchMyChannels(servers, "general").map((r) => r.channel.name)).toEqual(["général", "general-photo"]);
    });

    it("propose les salons d'un serveur dont le nom correspond, après les salons trouvés par leur nom", () => {
        expect(searchMyChannels(servers, "photo").map((r) => r.channel.name)).toEqual(["general-photo", "galerie"]);
    });

    it("ne renvoie rien pour une recherche vide et respecte la limite", () => {
        expect(searchMyChannels(servers, "   ")).toEqual([]);
        expect(searchMyChannels(servers, "e", 2)).toHaveLength(2);
    });
});
