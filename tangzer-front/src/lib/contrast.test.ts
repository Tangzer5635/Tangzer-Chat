import { describe, expect, it } from "vitest";

import { colorFor } from "./avatar";
import { colorName, SERVER_COLORS } from "./choices";
import { AA_TEXT, contrastRatio, isHexColor, readableTextOn } from "./contrast";

describe("contrastRatio", () => {
    it("donne 21:1 entre le noir et le blanc, 1:1 entre deux couleurs identiques", () => {
        expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
        expect(contrastRatio("#6b2f73", "#6b2f73")).toBeCloseTo(1, 5);
    });

    it("ne dépend pas de l'ordre des couleurs", () => {
        expect(contrastRatio("#666666", "#ffffff")).toBeCloseTo(contrastRatio("#ffffff", "#666666"), 10);
        expect(contrastRatio("#666666", "#ffffff")).toBeCloseTo(5.74, 2);
    });
});

describe("readableTextOn", () => {
    it("met du blanc sur un fond foncé et du noir sur un fond clair", () => {
        expect(readableTextOn("#6b2f73")).toBe("#ffffff");
        expect(readableTextOn("#faa61a")).toBe("#161616");
        expect(readableTextOn("#ffffff")).toBe("#161616");
    });

    it("atteint toujours le niveau AA, même sur une couleur intermédiaire", () => {
        for (const color of ["#3ba55c", "#1abc9c", "#00a8fc", "#ed4245", "#808080", "#ff00ff"]) {
            expect(contrastRatio(readableTextOn(color), color)).toBeGreaterThanOrEqual(AA_TEXT);
        }
    });

    it("se rabat sur le blanc si la couleur est invalide", () => {
        expect(readableTextOn("rouge")).toBe("#ffffff");
        expect(isHexColor("#FFF")).toBe(false);
    });
});

describe("couleurs des avatars et des serveurs", () => {
    it("gardent leurs initiales blanches lisibles (AA)", () => {
        const colors = [...SERVER_COLORS, ...Array.from({ length: 8 }, (_, id) => colorFor(id))];
        for (const color of colors) {
            expect(contrastRatio("#ffffff", color), color).toBeGreaterThanOrEqual(AA_TEXT);
        }
    });
});

describe("colorName", () => {
    it("nomme chaque couleur proposée, et retombe sur le code sinon", () => {
        for (const color of SERVER_COLORS) {
            expect(colorName(color)).not.toContain("#");
        }
        expect(colorName("#6B2F73")).toBe("Prune");
        expect(colorName("#123456")).toBe("Couleur #123456");
    });
});
