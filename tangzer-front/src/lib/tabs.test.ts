import { describe, expect, it } from "vitest";

import { nextTabIndex } from "./tabs";

describe("nextTabIndex", () => {
    it("passe à l'onglet suivant ou précédent avec les flèches, en bouclant", () => {
        expect(nextTabIndex("ArrowRight", 0, 3)).toBe(1);
        expect(nextTabIndex("ArrowRight", 2, 3)).toBe(0);
        expect(nextTabIndex("ArrowLeft", 0, 3)).toBe(2);
    });

    it("utilise haut et bas pour des onglets verticaux", () => {
        expect(nextTabIndex("ArrowDown", 1, 5, "vertical")).toBe(2);
        expect(nextTabIndex("ArrowUp", 0, 5, "vertical")).toBe(4);
        expect(nextTabIndex("ArrowRight", 1, 5, "vertical")).toBeNull();
    });

    it("va au premier et au dernier avec Début et Fin", () => {
        expect(nextTabIndex("Home", 3, 5)).toBe(0);
        expect(nextTabIndex("End", 0, 5)).toBe(4);
    });

    it("ignore les autres touches et les listes vides", () => {
        expect(nextTabIndex("Enter", 1, 3)).toBeNull();
        expect(nextTabIndex("ArrowRight", 0, 0)).toBeNull();
    });
});
