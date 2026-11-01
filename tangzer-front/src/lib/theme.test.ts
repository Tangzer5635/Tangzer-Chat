import { describe, expect, it } from "vitest";

import { DEFAULT_APPEARANCE, normalizeAppearance, THEMES } from "./theme";

describe("THEMES", () => {
    it("propose clair, sombre et selon l'appareil", () => {
        expect(THEMES.map((t) => t.id).sort()).toEqual(["dark", "light", "system"]);
        THEMES.forEach((theme) => expect(theme.description.length).toBeGreaterThan(0));
    });
});

describe("normalizeAppearance", () => {
    it("garde une apparence valide telle quelle", () => {
        expect(normalizeAppearance({ theme: "dark", fontSize: 18, compact: true }))
            .toEqual({ theme: "dark", fontSize: 18, compact: true });
    });

    it("remplace un ancien thème par « selon l'appareil »", () => {
        expect(normalizeAppearance({ theme: "neon", fontSize: 16, compact: false }).theme).toBe("system");
        expect(normalizeAppearance({ theme: "tangzer" }).theme).toBe("system");
    });

    it("ignore l'ancienne couleur d'accent", () => {
        expect(normalizeAppearance({ theme: "light", accentColor: "#ff0000", fontSize: 16, compact: false }))
            .toEqual({ theme: "light", fontSize: 16, compact: false });
    });

    it("borne la taille du texte et corrige les valeurs absurdes", () => {
        expect(normalizeAppearance({ fontSize: 40 }).fontSize).toBe(20);
        expect(normalizeAppearance({ fontSize: 2 }).fontSize).toBe(12);
        expect(normalizeAppearance({ fontSize: "grand" }).fontSize).toBe(16);
    });

    it("revient aux valeurs par défaut si rien n'est lisible", () => {
        expect(normalizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
        expect(normalizeAppearance("n'importe quoi")).toEqual(DEFAULT_APPEARANCE);
    });
});
