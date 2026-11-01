import { createContext, useContext } from "react";

import type { CallState, IncomingCall } from "../types/api";

export interface CurrentCall {
    channelId: number;
    serverId: number | null;
}

export interface CallContextValue {
    /** Tous les appels en cours que je peux voir, par salon. */
    calls: Record<number, CallState>;
    /** L'appel dans lequel je suis, ou null. */
    current: CurrentCall | null;
    connecting: boolean;
    muted: boolean;
    deafened: boolean;
    /** Ma caméra est allumée. */
    video: boolean;
    /** Je partage mon écran. */
    screen: boolean;
    /** Le navigateur sait partager l'écran (pas sur mobile). */
    screenShareSupported: boolean;
    /** Identifiants des personnes en train de parler (moi compris). */
    speaking: Set<number>;
    incoming: IncomingCall | null;
    /** Les appels ont besoin du micro, donc d'une page en HTTPS (ou localhost). */
    supported: boolean;
    join: (channelId: number) => Promise<void>;
    leave: () => void;
    toggleMute: () => void;
    toggleDeafen: () => void;
    toggleCamera: () => Promise<void>;
    toggleScreen: () => Promise<void>;
    /** Flux à afficher pour un participant (le mien = ma caméra ou mon écran). */
    streamOf: (userId: number) => MediaStream | null;
    acceptIncoming: () => void;
    declineIncoming: () => void;
}

export const CallContext = createContext<CallContextValue | null>(null);

export function useCalls(): CallContextValue {
    const ctx = useContext(CallContext);
    if (!ctx) {
        throw new Error("useCalls doit être utilisé dans <CallProvider>");
    }
    return ctx;
}
