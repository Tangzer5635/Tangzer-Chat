import { describe, expect, it } from "vitest";

import type { Member, MemberRole } from "../types/api";
import { applyMemberEvent, groupMembersByRole } from "./members";
import { canChangeRole, canKick, canManageServer } from "./permissions";

const member = (id: number, displayName: string, role: MemberRole = "MEMBER"): Member => ({
    user: { id, username: displayName.toLowerCase(), displayName },
    role,
    joinedAt: "2026-01-01T00:00:00Z",
});

describe("applyMemberEvent", () => {
    it("ajoute, met à jour et retire des membres", () => {
        let members = [member(1, "Alice")];
        members = applyMemberEvent(members, { type: "MEMBER_JOINED", payload: member(2, "Bob") });
        members = applyMemberEvent(members, { type: "MEMBER_JOINED", payload: member(2, "Bob") });
        members = applyMemberEvent(members, { type: "MEMBER_UPDATED", payload: member(2, "Bob", "ADMIN") });

        expect(members).toHaveLength(2);
        expect(members[1].role).toBe("ADMIN");

        members = applyMemberEvent(members, { type: "MEMBER_LEFT", payload: { serverId: 1, userId: 1 } });
        expect(members.map((m) => m.user.id)).toEqual([2]);
    });
});

describe("groupMembersByRole", () => {
    it("regroupe par rôle, trie par nom et omet les groupes vides", () => {
        const groups = groupMembersByRole([
            member(1, "Zoé"), member(2, "Émile"), member(3, "Chef", "OWNER"), member(4, "alice"),
        ]);

        expect(groups.map((g) => g.label)).toEqual(["Propriétaire", "Membres"]);
        expect(groups[1].members.map((m) => m.user.displayName)).toEqual(["alice", "Émile", "Zoé"]);
    });
});

describe("permissions", () => {
    it("seuls le propriétaire et les admins gèrent le serveur", () => {
        expect(canManageServer("OWNER")).toBe(true);
        expect(canManageServer("ADMIN")).toBe(true);
        expect(canManageServer("MEMBER")).toBe(false);
        expect(canManageServer(null)).toBe(false);
    });

    it("suit la hiérarchie pour les expulsions", () => {
        expect(canKick("OWNER", "ADMIN", false)).toBe(true);
        expect(canKick("ADMIN", "MEMBER", false)).toBe(true);
        expect(canKick("ADMIN", "ADMIN", false)).toBe(false);
        expect(canKick("ADMIN", "OWNER", false)).toBe(false);
        expect(canKick("MEMBER", "MEMBER", false)).toBe(false);
        expect(canKick("OWNER", "MEMBER", true)).toBe(false);
    });

    it("seul le propriétaire change les rôles", () => {
        expect(canChangeRole("OWNER", "MEMBER")).toBe(true);
        expect(canChangeRole("OWNER", "OWNER")).toBe(false);
        expect(canChangeRole("ADMIN", "MEMBER")).toBe(false);
    });
});
