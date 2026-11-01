import { describe, expect, it } from "vitest";

import type { CallState } from "../types/api";
import { applyCallState, departedPeers, rms, SPEAKING_THRESHOLD } from "./callsState";

const participant = (id: number) => ({
    user: { id, username: `u${id}`, displayName: `U${id}` },
    clientId: `c${id}`, muted: false, deafened: false, video: false, screen: false,
});

const state = (channelId: number, ...ids: number[]): CallState => ({
    channelId, serverId: 1, participants: ids.map(participant),
});

describe("applyCallState", () => {
    it("ajoute, met à jour puis retire un appel vide", () => {
        let calls = applyCallState({}, state(5, 1));
        calls = applyCallState(calls, state(5, 1, 2));
        expect(calls[5].participants).toHaveLength(2);

        calls = applyCallState(calls, state(5));
        expect(calls).toEqual({});
    });
});

describe("departedPeers", () => {
    it("trouve les participants partis", () => {
        expect(departedPeers([1, 2, 3], [1, 3, 4])).toEqual([2]);
    });
});

describe("rms", () => {
    it("vaut 0 pour le silence et grandit avec le volume", () => {
        expect(rms(new Uint8Array([128, 128, 128]))).toBe(0);
        expect(rms(new Uint8Array([]))).toBe(0);

        const loud = new Uint8Array(100).map((_, i) => (i % 2 ? 200 : 56));
        const quiet = new Uint8Array(100).map((_, i) => (i % 2 ? 131 : 125));
        expect(rms(loud)).toBeGreaterThan(SPEAKING_THRESHOLD);
        expect(rms(quiet)).toBeLessThan(SPEAKING_THRESHOLD);
    });
});
