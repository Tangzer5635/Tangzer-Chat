import { createContext, useContext } from "react";

import type { DmConversation } from "../types/api";

export interface DmContextValue {
    conversations: DmConversation[];
    loaded: boolean;
    getConversation: (channelId: number) => DmConversation | undefined;
    /** Ouvre (ou crée) la conversation avec cet utilisateur et la renvoie. */
    openWith: (userId: number) => Promise<DmConversation>;
}

export const DmContext = createContext<DmContextValue | null>(null);

export function useDms(): DmContextValue {
    const ctx = useContext(DmContext);
    if (!ctx) {
        throw new Error("useDms doit être utilisé dans <DmProvider>");
    }
    return ctx;
}
