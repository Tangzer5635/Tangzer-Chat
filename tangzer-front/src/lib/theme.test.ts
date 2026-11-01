import { describe, expect, it } from "vitest";

import { contrastText, darken, isHexColor, THEMES } from "./theme";

describe("couleurs", () => {
    it("reconnaît une couleur #rrggbb", () => {
        expect(isHexColor("#5865f2")).toBe(true);
        expect(isHexColor("#FFF")).toBe(false);
        expect(isHexColor("rouge")).toBe(false);
    });

    it("assombrit une couleur", () => {
        expect(darken("#ffffff", 0.5)).toBe("#808080");
        expect(darken("#5865f2", 0)).toBe("#5865f2");
        expect(darken("#5865f2", 1)).toBe("#000000");
    });

    it("choisit un texte lisible sur l'accent", () => {
        expect(contrastText("#5865f2")).toBe("#ffffff");
        expect(contrastText("#faa61a")).toBe("#060607");
        expect(contrastText("#ffffff")).toBe("#060607");
    });
});

describe("THEMES", () => {
    it("propose six thèmes avec un aperçu complet", () => {
        expect(THEMES).toHaveLength(6);
        THEMES.forEach((theme) => theme.preview.forEach((color) => expect(isHexColor(color)).toBe(true)));
    });
});
