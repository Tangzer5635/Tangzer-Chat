import { describe, expect, it } from "vitest";

import { deviceConstraint } from "./devicePrefs";

describe("deviceConstraint", () => {
    it("demande l'appareil choisi, sinon celui par défaut", () => {
        expect(deviceConstraint("micro-usb")).toEqual({ deviceId: { exact: "micro-usb" } });
        expect(deviceConstraint(null)).toEqual({});
    });
});
