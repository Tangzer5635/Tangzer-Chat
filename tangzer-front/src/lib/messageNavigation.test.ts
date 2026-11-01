import { describe, expect, it } from "vitest";

import { messageFocusIndex } from "./messageNavigation";

describe("messageFocusIndex", () => {
    it("part du message le plus récent quand le focus est sur le fil", () => {
        expect(messageFocusIndex("ArrowUp", -1, 5)).toBe(4);
        expect(messageFocusIndex("ArrowDown", -1, 5)).toBe(4);
    });

    it("monte et descend d'un message, sans boucler", () => {
        expect(messageFocusIndex("ArrowUp", 3, 5)).toBe(2);
        expect(messageFocusIndex("ArrowDown", 3, 5)).toBe(4);
        expect(messageFocusIndex("ArrowUp", 0, 5)).toBe(0);
        expect(messageFocusIndex("ArrowDown", 4, 5)).toBe(4);
    });

    it("va au premier et au dernier message avec Début et Fin", () => {
        expect(messageFocusIndex("Home", 2, 5)).toBe(0);
        expect(messageFocusIndex("End", 2, 5)).toBe(4);
    });

    it("ignore les autres touches et un fil vide", () => {
        expect(messageFocusIndex("Enter", 2, 5)).toBeNull();
        expect(messageFocusIndex("ArrowUp", -1, 0)).toBeNull();
    });
});
