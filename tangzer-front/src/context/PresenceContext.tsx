import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { fetchPresence } from "../api/presence";
import { isIdle } from "../lib/presence";
import { useRealtimeConnected, useSubscription } from "../realtime/hooks";
import { publish } from "../realtime/stomp";
import type { Presence, UserStatus } from "../types/api";
import { useAuth } from "./auth";
import { PresenceContext, type PresenceContextValue } from "./presence";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"] as const;

/**
 * Présence de tout le monde (qui est en ligne, inactif, occupé…),
 * et détection de ma propre inactivité.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const connected = useRealtimeConnected();
    const [presences, setPresences] = useState<Record<number, Presence>>({});
    const idle = useRef(false);

    // À chaque (re)connexion : photo complète de qui est en ligne, et on rappelle si on est inactif.
    useEffect(() => {
        if (!connected) {
            return;
        }
        fetchPresence()
            .then((list) => setPresences(Object.fromEntries(list.map((p) => [p.userId, p]))))
            .catch(() => undefined);
        if (idle.current) {
            publish("/app/presence/idle", { idle: true });
        }
    }, [connected]);

    useSubscription<Presence>("/topic/presence", (presence) => {
        setPresences((current) => ({ ...current, [presence.userId]: presence }));
    });

    // Inactif après 5 minutes sans activité dans cet onglet.
    useEffect(() => {
        let lastActivity = Date.now();
        const report = (value: boolean) => {
            if (idle.current !== value) {
                idle.current = value;
                publish("/app/presence/idle", { idle: value });
            }
        };
        const onActivity = () => {
            lastActivity = Date.now();
            report(false);
        };
        ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
        const timer = setInterval(() => report(isIdle(lastActivity, Date.now())), 15_000);
        return () => {
            ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
            clearInterval(timer);
        };
    }, []);

    const statusOf = useCallback((userId: number): UserStatus => {
        // Pour moi-même, « invisible » s'affiche tel quel (les autres me voient hors ligne).
        if (user && userId === user.id && user.status === "INVISIBLE") {
            return "INVISIBLE";
        }
        return presences[userId]?.status ?? "OFFLINE";
    }, [presences, user]);

    const customStatusOf = useCallback((userId: number) => {
        if (user && userId === user.id) {
            return user.customStatus;
        }
        return presences[userId]?.customStatus ?? null;
    }, [presences, user]);

    const value = useMemo<PresenceContextValue>(() => ({ statusOf, customStatusOf }), [statusOf, customStatusOf]);

    return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
