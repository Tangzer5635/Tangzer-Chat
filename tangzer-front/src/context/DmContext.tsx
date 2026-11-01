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

    useEffect(() => {
        listConversations()
            .then((conversations) => dispatch({ type: "loaded", conversations }))
            .catch(() => dispatch({ type: "loaded", conversations: [] }));
    }, []);

    useSubscription<RealtimeEvent>("/user/queue/events", (event) => {
        if (event.type === "DM_ACTIVITY" && user) {
            dispatch({ type: "activity", activity: event.payload as DmActivity, myUserId: user.id });
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
        () => ({ conversations: state.conversations, loaded: state.loaded, getConversation, openWith }),
        [state.conversations, state.loaded, getConversation, openWith]
    );

    return <DmContext.Provider value={value}>{children}</DmContext.Provider>;
}
