import { describe, expect, it } from "vitest";

import { initialUnreadState, sumFor, unreadReducer } from "./unreadReducer";

describe("unreadReducer", () => {
    it("charge les compteurs puis les incrémente", () => {
        let state = unreadReducer(initialUnreadState, {
            type: "loaded", entries: [{ channelId: 1, serverId: 1, count: 3 }],
        });
        state = unreadReducer(state, { type: "activity", channelId: 1, mentioned: false });
        state = unreadReducer(state, { type: "activity", channelId: 2, mentioned: true });

        expect(state.counts).toEqual({ 1: 4, 2: 1 });
        expect(state.mentions).toEqual({ 2: 1 });
    });

    it("remet un salon à zéro quand on le lit", () => {
        let state = unreadReducer(initialUnreadState, { type: "activity", channelId: 2, mentioned: true });
        state = unreadReducer(state, { type: "read", channelId: 2 });

        expect(state).toEqual({ counts: {}, mentions: {} });
        expect(unreadReducer(state, { type: "read", channelId: 2 })).toBe(state);
    });

    it("additionne les compteurs d'un ensemble de salons", () => {
        expect(sumFor({ 1: 2, 2: 3, 9: 10 }, [1, 2, 3])).toBe(5);
    });
});
