import { describe, expect, it } from "vitest";

import { fitWithin, formatBytes, validateImageFile } from "./attachments";

describe("validateImageFile", () => {
    it("accepte les images jusqu'à 10 Mo", () => {
        expect(validateImageFile({ name: "chat.png", type: "image/png", size: 2048 })).toBeNull();
        expect(validateImageFile({ name: "anim.gif", type: "image/gif", size: 10 * 1024 * 1024 })).toBeNull();
    });

    it("refuse les autres fichiers et les images trop lourdes", () => {
        expect(validateImageFile({ name: "cv.pdf", type: "application/pdf", size: 10 })).toContain("n'est pas une image");
        expect(validateImageFile({ name: "photo.jpg", type: "image/jpeg", size: 12 * 1024 * 1024 })).toContain("trop lourde");
    });
});

describe("formatBytes", () => {
    it("affiche une taille lisible", () => {
        expect(formatBytes(512)).toBe("512 o");
        expect(formatBytes(1536)).toBe("1,5 Ko");
        expect(formatBytes(3 * 1024 * 1024)).toBe("3 Mo");
        expect(formatBytes(15 * 1024 * 1024)).toBe("15 Mo");
    });
});

describe("fitWithin", () => {
    it("réduit en gardant les proportions", () => {
        expect(fitWithin(1600, 1200, 400, 300)).toEqual({ width: 400, height: 300 });
        expect(fitWithin(1000, 2000, 400, 300)).toEqual({ width: 150, height: 300 });
    });

    it("n'agrandit jamais une petite image", () => {
        expect(fitWithin(100, 50, 400, 300)).toEqual({ width: 100, height: 50 });
    });
});
