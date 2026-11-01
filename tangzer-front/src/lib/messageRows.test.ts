import { describe, expect, it } from "vitest";

import type { Message } from "../types/api";
import { buildRows, dayLabel, typingLabel } from "./messageRows";

const alice = { id: 1, username: "alice", displayName: "Alice" };
const bob = { id: 2, username: "bob", displayName: "Bob" };

const at = (day: number, hour: number, minute: number) => new Date(2026, 2, day, hour, minute).toISOString();

const message = (id: number, author: typeof alice, createdAt: string, replyTo = false): Message => ({
    id,
    channelId: 1,
    author,
    content: "…",
    createdAt,
    editedAt: null,
    replyTo: replyTo ? { id: 99, author: bob, content: "origine" } : null,
    reactions: [],
});

describe("buildRows", () => {
    const now = new Date(2026, 2, 10, 18, 0);

    it("insère les séparateurs de jour et regroupe par auteur", () => {
        const rows = buildRows([
            message(1, alice, at(9, 20, 0)),
            message(2, alice, at(10, 9, 0)),
            message(3, alice, at(10, 9, 1)),
            message(4, bob, at(10, 9, 2)),
        ], now);

        expect(rows.map((r) => (r.kind === "day" ? r.label : `${r.message.id}${r.showHeader ? "+" : ""}`)))
            .toEqual(["Hier", "1+", "Aujourd'hui", "2+", "3", "4+"]);
    });

    it("réaffiche l'en-tête après 5 minutes ou pour une réponse", () => {
        const rows = buildRows([
            message(1, alice, at(10, 9, 0)),
            message(2, alice, at(10, 9, 10)),
            message(3, alice, at(10, 9, 11), true),
        ], now).filter((r) => r.kind === "message");

        expect(rows.map((r) => r.kind === "message" && r.showHeader)).toEqual([true, true, true]);
    });
});

describe("dayLabel", () => {
    it("affiche une date complète au-delà d'hier", () => {
        expect(dayLabel(at(3, 12, 0), new Date(2026, 2, 10))).toBe("mardi 3 mars 2026");
    });
});

describe("typingLabel", () => {
    it("adapte la phrase au nombre de personnes", () => {
        expect(typingLabel([])).toBeNull();
        expect(typingLabel(["Alice"])).toBe("Alice est en train d'écrire…");
        expect(typingLabel(["Alice", "Bob"])).toBe("Alice et Bob sont en train d'écrire…");
        expect(typingLabel(["Alice", "Bob", "Zoé"])).toBe("Alice, Bob et Zoé sont en train d'écrire…");
        expect(typingLabel(["A", "B", "C", "D"])).toBe("Plusieurs personnes sont en train d'écrire…");
    });
});
