import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from "react";

import { listMyServers } from "../api/servers";
import { initialServersState, serverEventToAction, serversReducer, type ServersAction } from "../lib/serversReducer";
import { useSubscription } from "../realtime/hooks";
import type { RealtimeEvent, Server } from "../types/api";
import { useAuth } from "./auth";
import { ServersContext, type ServersContextValue } from "./servers";
import { useToasts } from "./toasts";

/** Écoute /topic/servers/{id} pour un serveur dont on est membre. */
function ServerEvents({ server, onAction }: { server: Server; onAction: (action: ServersAction) => void }) {
    const { user } = useAuth();
    const { pushToast } = useToasts();

    useSubscription<RealtimeEvent>(`/topic/servers/${server.id}`, (event) => {
        const action = serverEventToAction(server.id, event, user?.id ?? -1);
        if (action) {
            onAction(action);
        }
        if (event.type === "SERVER_DELETED") {
            pushToast(`Le serveur « ${server.name} » a été supprimé.`);
        }
    });

    return null;
}

/**
 * Liste de mes serveurs (avec leurs salons), tenue à jour en temps réel.
 */
export function ServersProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(serversReducer, initialServersState);
    const { pushToast } = useToasts();

    useEffect(() => {
        listMyServers()
            .then((servers) => dispatch({ type: "loaded", servers }))
            .catch(() => dispatch({ type: "loaded", servers: [] }));
    }, []);

    // Événements personnels : serveur rejoint (depuis un autre onglet) ou retiré (expulsion).
    useSubscription<RealtimeEvent>("/user/queue/events", (event) => {
        if (event.type === "SERVER_JOINED") {
            dispatch({ type: "serverUpserted", server: event.payload as Server });
        }
        if (event.type === "SERVER_REMOVED") {
            const { serverId, reason } = event.payload as { serverId: number; reason: string };
            const name = state.servers.find((s) => s.id === serverId)?.name;
            dispatch({ type: "serverRemoved", serverId });
            if (reason === "KICKED" && name) {
                pushToast(`Tu as été expulsé du serveur « ${name} ».`, { tone: "error" });
            }
        }
    });

    const getServer = useCallback(
        (serverId: number) => state.servers.find((s) => s.id === serverId),
        [state.servers]
    );

    const value = useMemo<ServersContextValue>(
        () => ({ servers: state.servers, loaded: state.loaded, getServer, dispatch }),
        [state.servers, state.loaded, getServer]
    );

    return (
        <ServersContext.Provider value={value}>
            {state.servers.map((server) => (
                <ServerEvents key={server.id} server={server} onAction={dispatch} />
            ))}
            {children}
        </ServersContext.Provider>
    );
}
