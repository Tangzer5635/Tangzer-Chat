import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

import { isConnected, onStatusChange, subscribe } from "./stomp";

/**
 * Écoute une destination STOMP tant que le composant est affiché.
 * Passer null pour ne rien écouter.
 */
export function useSubscription<T>(destination: string | null, handler: (body: T) => void) {
    const onMessage = useEffectEvent((body: unknown) => handler(body as T));

    useEffect(() => {
        if (!destination) {
            return;
        }
        return subscribe(destination, onMessage);
    }, [destination]);
}

/** true quand la connexion temps réel est établie. */
export function useRealtimeConnected(): boolean {
    return useSyncExternalStore(onStatusChange, isConnected);
}
