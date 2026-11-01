import { describe, expect, it } from "vitest";

import { centeredSquare } from "./image";

describe("centeredSquare", () => {
    it("garde le centre d'une image en paysage", () => {
        expect(centeredSquare(1600, 900)).toEqual({ sx: 350, sy: 0, size: 900 });
    });

    it("garde le centre d'une image en portrait", () => {
        expect(centeredSquare(600, 1000)).toEqual({ sx: 0, sy: 200, size: 600 });
    });

    it("ne touche pas à une image déjà carrée", () => {
        expect(centeredSquare(256, 256)).toEqual({ sx: 0, sy: 0, size: 256 });
    });
});
