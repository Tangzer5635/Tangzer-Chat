import { describe, expect, it } from "vitest";

import { INSECURE_LISTEN_ONLY, listenOnlyReason } from "./micErrors";

describe("listenOnlyReason", () => {
    it("explique un micro refusé et comment l'autoriser", () => {
        const text = listenOnlyReason(new DOMException("refusé", "NotAllowedError"));
        expect(text).toContain("refusé");
        expect(text).toContain("écoute seule");
    });

    it("signale l'absence de micro", () => {
        expect(listenOnlyReason(new DOMException("absent", "NotFoundError"))).toBe("Aucun micro détecté : tu rejoins en écoute seule.");
    });

    it("reste générique pour toute autre erreur", () => {
        expect(listenOnlyReason(new Error("bizarre"))).toBe("Micro indisponible : tu rejoins en écoute seule.");
        expect(listenOnlyReason(null)).toBe("Micro indisponible : tu rejoins en écoute seule.");
    });

    it("garde un message dédié pour les pages en HTTP", () => {
        expect(INSECURE_LISTEN_ONLY).toContain("HTTPS");
        expect(INSECURE_LISTEN_ONLY).toContain("écoute seule");
    });
});
