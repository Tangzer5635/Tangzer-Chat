import { useRealtimeConnected } from "../realtime/hooks";

/** Bandeau affiché quand la connexion temps réel est perdue (elle se rétablit seule). */
export default function ConnectionBanner() {
    const connected = useRealtimeConnected();

    if (connected) {
        return null;
    }
    return <div className="connection-banner">Connexion au serveur perdue, reconnexion…</div>;
}
