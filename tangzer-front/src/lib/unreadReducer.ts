import type { UnreadEntry } from "../types/api";

/**
 * Compteurs de non-lus et de mentions, par salon.
 */

export interface UnreadState {
    /** channelId → nombre de messages non lus */
    counts: Record<number, number>;
    /** channelId → nombre de mentions non lues */
    mentions: Record<number, number>;
}

export type UnreadAction =
    | { type: "loaded"; entries: UnreadEntry[] }
    | { type: "activity"; channelId: number; mentioned: boolean }
    | { type: "read"; channelId: number };

export const initialUnreadState: UnreadState = { counts: {}, mentions: {} };

export function unreadReducer(state: UnreadState, action: UnreadAction): UnreadState {
    switch (action.type) {
        case "loaded":
            return {
                counts: Object.fromEntries(action.entries.map((e) => [e.channelId, e.count])),
                mentions: state.mentions,
            };

        case "activity":
            return {
                counts: { ...state.counts, [action.channelId]: (state.counts[action.channelId] ?? 0) + 1 },
                mentions: action.mentioned
                    ? { ...state.mentions, [action.channelId]: (state.mentions[action.channelId] ?? 0) + 1 }
                    : state.mentions,
            };

        case "read": {
            if (!state.counts[action.channelId] && !state.mentions[action.channelId]) {
                return state;
            }
            const counts = { ...state.counts };
            const mentions = { ...state.mentions };
            delete counts[action.channelId];
            delete mentions[action.channelId];
            return { counts, mentions };
        }
    }
}

/** Total pour une liste de salons (ex. tous les salons d'un serveur). */
export function sumFor(values: Record<number, number>, channelIds: number[]): number {
    return channelIds.reduce((total, id) => total + (values[id] ?? 0), 0);
}
