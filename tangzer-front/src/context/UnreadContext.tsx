import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import { fetchUnread, markChannelRead } from "../api/messages";
import { toPlainText } from "../lib/markdown";
import { initialUnreadState, unreadReducer } from "../lib/unreadReducer";
import { useSubscription } from "../realtime/hooks";
import type { ChannelActivity, DmActivity, RealtimeEvent, Server } from "../types/api";
import { useAuth } from "./auth";
import { useServers } from "./servers";
import { useToasts } from "./toasts";
import { UnreadContext, type UnreadContextValue } from "./unread";

/** Écoute l'activité (nouveaux messages) d'un serveur. */
function ServerActivity({ server, onActivity }: { server: Server; onActivity: (activity: ChannelActivity, server: Server) => void }) {
    useSubscription<RealtimeEvent>(`/topic/servers/${server.id}`, (event) => {
        if (event.type === "CHANNEL_ACTIVITY") {
            onActivity(event.payload as ChannelActivity, server);
        }
    });
    return null;
}

/**
 * Non-lus et mentions de tous mes salons : chargés au démarrage,
 * puis mis à jour à chaque nouveau message.
 */
export function UnreadProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { servers } = useServers();
    const { pushToast } = useToasts();
    const [state, dispatch] = useReducer(unreadReducer, initialUnreadState);
    const activeChannel = useRef<number | null>(null);

    useEffect(() => {
        fetchUnread()
            .then((entries) => dispatch({
                type: "loaded",
                entries: entries.filter((e) => e.channelId !== activeChannel.current),
            }))
            .catch(() => undefined);
    }, []);

    const onActivity = useCallback((activity: ChannelActivity, server: Server) => {
        if (!user || activity.authorId === user.id) {
            return;
        }
        const viewing = activity.channelId === activeChannel.current && document.visibilityState === "visible";
        if (viewing) {
            return;
        }
        const mentioned = activity.mentions.includes(user.username);
        dispatch({ type: "activity", channelId: activity.channelId, mentioned });

        // « Ne pas déranger » : les compteurs bougent, mais pas de notification.
        if (mentioned && user.status !== "DND") {
            const channel = server.channels.find((c) => c.id === activity.channelId);
            pushToast(`🔔 Tu as été mentionné dans #${channel?.name ?? "?"} (${server.name})`, {
                link: `/app/servers/${server.id}/channels/${activity.channelId}`,
            });
        }
    }, [user, pushToast]);

    // Messages privés : chaque message reçu compte comme une notification.
    useSubscription<RealtimeEvent>("/user/queue/events", (event) => {
        if (event.type !== "DM_ACTIVITY" || !user) {
            return;
        }
        const { channelId, message } = event.payload as DmActivity;
        const viewing = channelId === activeChannel.current && document.visibilityState === "visible";
        if (message.author.id === user.id || viewing) {
            return;
        }
        dispatch({ type: "activity", channelId, mentioned: false });
        if (user.status === "DND") {
            return;
        }
        const preview = toPlainText(message.content) || "📷 Photo";
        pushToast(`💬 ${message.author.displayName} : ${preview.length > 60 ? `${preview.slice(0, 60)}…` : preview}`, {
            link: `/app/dm/${channelId}`,
        });
    });

    const setActiveChannel = useCallback((channelId: number | null) => {
        activeChannel.current = channelId;
    }, []);

    const markRead = useCallback((channelId: number, messageId: number) => {
        dispatch({ type: "read", channelId });
        markChannelRead(channelId, messageId).catch(() => undefined);
    }, []);

    const value = useMemo<UnreadContextValue>(
        () => ({ counts: state.counts, mentions: state.mentions, setActiveChannel, markRead }),
        [state, setActiveChannel, markRead]
    );

    return (
        <UnreadContext.Provider value={value}>
            {servers.map((server) => (
                <ServerActivity key={server.id} server={server} onActivity={onActivity} />
            ))}
            {children}
        </UnreadContext.Provider>
    );
}
