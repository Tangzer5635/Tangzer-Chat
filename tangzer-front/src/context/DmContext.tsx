import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from "react";

import { listConversations, openConversation } from "../api/dms";
import { dmReducer, initialDmState } from "../lib/dmReducer";
import { useSubscription } from "../realtime/hooks";
import type { DmActivity, RealtimeEvent } from "../types/api";
import { useAuth } from "./auth";
import { DmContext, type DmContextValue } from "./dms";

/** Mes conversations privées, tenues à jour à chaque nouveau message. */
export function DmProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(dmReducer, initialDmState);

    const refresh = useCallback(async () => {
        try {
            dispatch({ type: "loaded", conversations: await listConversations() });
        } catch {
            dispatch({ type: "loaded", conversations: [] });
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useSubscription<RealtimeEvent>("/user/queue/events", (event) => {
        if (event.type === "DM_ACTIVITY" && user) {
            dispatch({ type: "activity", activity: event.payload as DmActivity, myUserId: user.id });
        }
        // Quelqu'un m'appelle dans une conversation que je n'ai pas encore : on recharge.
        if (event.type === "INCOMING_CALL") {
            const { channelId } = event.payload as { channelId: number };
            if (!state.conversations.some((c) => c.channelId === channelId)) {
                void refresh();
            }
        }
    });

    const getConversation = useCallback(
        (channelId: number) => state.conversations.find((c) => c.channelId === channelId),
        [state.conversations]
    );

    const openWith = useCallback(async (userId: number) => {
        const conversation = await openConversation(userId);
        dispatch({ type: "upserted", conversation });
        return conversation;
    }, []);

    const value = useMemo<DmContextValue>(
        () => ({ conversations: state.conversations, loaded: state.loaded, getConversation, openWith, refresh }),
        [state.conversations, state.loaded, getConversation, openWith, refresh]
    );

    return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
}
