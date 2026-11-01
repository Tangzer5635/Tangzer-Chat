import type { CallState } from "../types/api";

/** Appels en cours, par salon : un appel sans participant disparaît. */
export function applyCallState(calls: Record<number, CallState>, state: CallState): Record<number, CallState> {
    const next = { ...calls };
    if (state.participants.length === 0) {
        delete next[state.channelId];
    } else {
        next[state.channelId] = state;
    }
    return next;
}

/** Les participants que je dois quitter : ceux qui ne sont plus dans l'appel. */
export function departedPeers(connected: number[], participants: number[]): number[] {
    return connected.filter((id) => !participants.includes(id));
}

/**
 * Niveau sonore (0 à 1) d'un échantillon renvoyé par AnalyserNode.getByteTimeDomainData :
 * moyenne quadratique de l'écart au silence (128).
 */
export function rms(samples: Uint8Array): number {
    if (samples.length === 0) {
        return 0;
    }
    let sum = 0;
    for (const value of samples) {
        const centered = (value - 128) / 128;
        sum += centered * centered;
    }
    return Math.sqrt(sum / samples.length);
}

/** Au-dessus de ce niveau, on considère que la personne parle. */
export const SPEAKING_THRESHOLD = 0.04;
