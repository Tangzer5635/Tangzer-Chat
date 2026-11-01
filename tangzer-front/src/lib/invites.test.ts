import { describe, expect, it } from "vitest";

import { describeExpiry, inviteUrl, parseInviteCode } from "./invites";

describe("parseInviteCode", () => {
    it("accepte un code seul ou un lien", () => {
        expect(parseInviteCode("aB3dE5fG")).toBe("aB3dE5fG");
        expect(parseInviteCode("  https://tangzer.lan/invite/aB3dE5fG  ")).toBe("aB3dE5fG");
        expect(parseInviteCode("/invite/aB3dE5fG/")).toBe("aB3dE5fG");
    });

    it("refuse ce qui n'est pas un code", () => {
        expect(parseInviteCode("")).toBeNull();
        expect(parseInviteCode("pas un code")).toBeNull();
        expect(parseInviteCode("https://exemple.com/autre")).toBeNull();
    });
});

describe("inviteUrl", () => {
    it("construit le lien à partager", () => {
        expect(inviteUrl("abc", "https://tangzer.lan")).toBe("https://tangzer.lan/invite/abc");
    });
});

describe("describeExpiry", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const inMs = (ms: number) => new Date(now.getTime() + ms).toISOString();

    it("décrit la durée restante", () => {
        expect(describeExpiry(null, now)).toBe("n'expire jamais");
        expect(describeExpiry(inMs(-1000), now)).toBe("a expiré");
        expect(describeExpiry(inMs(30 * 60_000), now)).toBe("expire dans 30 minutes");
        expect(describeExpiry(inMs(60 * 60_000), now)).toBe("expire dans 1 heure");
        expect(describeExpiry(inMs(24 * 3600_000), now)).toBe("expire dans 24 heures");
        expect(describeExpiry(inMs(7 * 24 * 3600_000), now)).toBe("expire dans 7 jours");
    });
});
