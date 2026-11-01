import { createContext, useContext } from "react";

export interface UnreadContextValue {
    /** channelId → nombre de messages non lus */
    counts: Record<number, number>;
    /** channelId → nombre de mentions non lues */
    mentions: Record<number, number>;
    /** Salon affiché à l'écran (ses nouveaux messages ne comptent pas comme non lus). */
    setActiveChannel: (channelId: number | null) => void;
    markRead: (channelId: number, messageId: number) => void;
}

export const UnreadContext = createContext<UnreadContextValue | null>(null);

export function useUnread(): UnreadContextValue {
    const ctx = useContext(UnreadContext);
    if (!ctx) {
        throw new Error("useUnread doit être utilisé dans <UnreadProvider>");
    }
    return ctx;
}
