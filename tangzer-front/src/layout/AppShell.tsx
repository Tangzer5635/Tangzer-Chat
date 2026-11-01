import { Outlet } from "react-router-dom";

import ConnectionBanner from "../components/ConnectionBanner";
import ServerRail from "../components/ServerRail";
import { useToasts } from "../context/toasts";
import { useSubscription } from "../realtime/hooks";

/** Squelette de l'application connectée : rail des serveurs + page courante. */
export default function AppShell() {
    const { pushToast } = useToasts();

    // Erreurs renvoyées par le serveur pour une action STOMP (message trop long…).
    useSubscription<{ message: string }>("/user/queue/errors", (error) => {
        pushToast(error.message, { tone: "error" });
    });

    return (
        <div className="app-shell">
            <ConnectionBanner />
            <ServerRail />
            <Outlet />
        </div>
    );
}
