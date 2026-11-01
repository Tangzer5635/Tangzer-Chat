import { describe, expect, it } from "vitest";

import { colorFor, initials } from "./avatar";

describe("avatar", () => {
    it("calcule les initiales, y compris avec des emojis", () => {
        expect(initials("Groupe Fond à droite")).toBe("GF");
        expect(initials("tanguy")).toBe("T");
        expect(initials("🎮 Gamers")).toBe("🎮G");
        expect(initials("   ")).toBe("");
    });

    it("donne toujours la même couleur au même utilisateur", () => {
        expect(colorFor(42)).toBe(colorFor(42));
        expect(colorFor(1)).not.toBe(colorFor(2));
    });
});
