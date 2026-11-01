import { describe, expect, it } from "vitest";

import type { Member, MemberRole, UserStatus } from "../types/api";
import { groupMembersByPresence, IDLE_AFTER_MS, isIdle } from "./presence";

const member = (id: number, displayName: string, role: MemberRole = "MEMBER"): Member => ({
    user: { id, username: displayName.toLowerCase(), displayName },
    role,
    joinedAt: "2026-01-01T00:00:00Z",
});

describe("isIdle", () => {
    it("passe inactif après 5 minutes sans activité", () => {
        expect(isIdle(0, IDLE_AFTER_MS - 1)).toBe(false);
        expect(isIdle(0, IDLE_AFTER_MS)).toBe(true);
    });
});

describe("groupMembersByPresence", () => {
    it("regroupe les connectés par rôle puis met les hors ligne à la fin", () => {
        const statuses: Record<number, UserStatus> = { 1: "ONLINE", 2: "OFFLINE", 3: "DND", 4: "IDLE", 5: "OFFLINE" };
        const groups = groupMembersByPresence(
            [member(1, "Chef", "OWNER"), member(2, "Zoé"), member(3, "Bob"), member(4, "Alice", "ADMIN"), member(5, "Ana", "ADMIN")],
            (id) => statuses[id],
        );

        expect(groups.map((g) => `${g.label}:${g.members.map((m) => m.user.displayName).join(",")}`)).toEqual([
            "Propriétaire:Chef",
            "Admins:Alice",
            "En ligne:Bob",
            "Hors ligne:Ana,Zoé",
        ]);
        expect(groups.at(-1)?.offline).toBe(true);
    });

    it("n'affiche pas de groupe hors ligne si tout le monde est là", () => {
        const groups = groupMembersByPresence([member(1, "Chef", "OWNER")], () => "ONLINE");
        expect(groups.map((g) => g.label)).toEqual(["Propriétaire"]);
    });
});
