import { describe, expect, it } from "vitest";

import type { ChannelMessage } from "../types/api";
import { colorFor, initials } from "./avatar";
import { groupMessages } from "./messages";

const alice = { id: 1, username: "alice", displayName: "Alice" };
const bob = { id: 2, username: "bob", displayName: "Bob" };

const message = (id: string, author: typeof alice, minute: number): ChannelMessage => ({
    id,
    channelId: 1,
    author,
    content: `message ${id}`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 12, minute)).toISOString(),
});

describe("groupMessages", () => {
    it("regroupe les messages consécutifs d'un même auteur", () => {
        const groups = groupMessages([
            message("1", alice, 0),
            message("2", alice, 1),
            message("3", bob, 2),
            message("4", alice, 3),
        ]);

        expect(groups.map((g) => g.messages.map((m) => m.id))).toEqual([["1", "2"], ["3"], ["4"]]);
    });

    it("coupe le groupe après 5 minutes de silence", () => {
        const groups = groupMessages([message("1", alice, 0), message("2", alice, 6)]);

        expect(groups).toHaveLength(2);
    });

    it("gère une liste vide", () => {
        expect(groupMessages([])).toEqual([]);
    });
});

describe("avatar", () => {
    it("calcule les initiales, y compris avec des emojis", () => {
        expect(initials("Groupe Fond à droite")).toBe("GF");
        expect(initials("tanguy")).toBe("T");
        expect(initials("🎮 Gamers")).toBe("🎮G");
        expect(initials("   ")).toBe("");
    });

    it("donne toujours la même couleur au même utilisateur", () => {
        expect(colorFor(42)).toBe(colorFor(42));
        expect(colorFor(1)).not.toBe(colorFor(2));
    });
});
