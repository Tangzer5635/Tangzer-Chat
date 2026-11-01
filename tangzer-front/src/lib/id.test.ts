import { afterEach, describe, expect, it, vi } from "vitest";

import { randomId } from "./id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomId", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renvoie un UUID v4", () => {
        expect(randomId()).toMatch(UUID_V4);
    });

    it("fonctionne sans crypto.randomUUID (HTTP sur le réseau local)", () => {
        const realCrypto = globalThis.crypto;
        vi.stubGlobal("crypto", {
            getRandomValues: (array: Uint8Array<ArrayBuffer>) => realCrypto.getRandomValues(array),
        });

        const ids = new Set(Array.from({ length: 50 }, () => randomId()));

        expect(ids.size).toBe(50);
        ids.forEach((id) => expect(id).toMatch(UUID_V4));
    });
});
