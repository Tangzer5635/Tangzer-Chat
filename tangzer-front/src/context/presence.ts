import { createContext, useContext } from "react";

import type { UserStatus } from "../types/api";

export interface PresenceContextValue {
    /** Statut affiché pour un utilisateur (OFFLINE par défaut). */
    statusOf: (userId: number) => UserStatus;
    customStatusOf: (userId: number) => string | null;
}

export const PresenceContext = createContext<PresenceContextValue | null>(null);

export function usePresence(): PresenceContextValue {
    const ctx = useContext(PresenceContext);
    if (!ctx) {
        throw new Error("usePresence doit être utilisé dans <PresenceProvider>");
    }
    return ctx;
}
