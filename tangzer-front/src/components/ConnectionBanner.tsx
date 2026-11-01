import { TriangleAlert } from "lucide-react";

import { useRealtimeConnected } from "../realtime/hooks";

/** Bandeau affiché quand la connexion temps réel est perdue (elle se rétablit seule). */
export default function ConnectionBanner() {
    const connected = useRealtimeConnected();

    return (
        // La zone reste dans la page pour que le message soit annoncé dès qu'il apparaît.
        <div className="connection-banner-region" role="status">
            {!connected && (
                <div className="connection-banner">
                    <TriangleAlert size={18} />
                    Connexion au serveur perdue. Reconnexion en cours…
                </div>
            )}
        </div>
    );
}
