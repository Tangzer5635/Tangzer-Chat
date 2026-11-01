import { describe, expect, it } from "vitest";

import { gridColumns, orderTiles, pickVideoTrack } from "./video";

const track = (id: string) => ({ id }) as MediaStreamTrack;

describe("pickVideoTrack", () => {
    it("envoie l'écran en priorité, sinon la caméra", () => {
        expect(pickVideoTrack(track("cam"), track("écran"))?.id).toBe("écran");
        expect(pickVideoTrack(track("cam"), null)?.id).toBe("cam");
        expect(pickVideoTrack(null, null)).toBeNull();
    });
});

describe("gridColumns", () => {
    it("adapte la grille au nombre de participants", () => {
        expect([1, 2, 3, 4, 5, 9, 12].map(gridColumns)).toEqual([1, 2, 2, 2, 3, 3, 4]);
    });
});

describe("orderTiles", () => {
    it("met la tuile agrandie puis les écrans partagés en premier", () => {
        const tiles = [
            { userId: 1, screen: false },
            { userId: 2, screen: true },
            { userId: 3, screen: false },
        ];
        expect(orderTiles(tiles, null).map((t) => t.userId)).toEqual([2, 1, 3]);
        expect(orderTiles(tiles, 3).map((t) => t.userId)).toEqual([3, 2, 1]);
    });
});
