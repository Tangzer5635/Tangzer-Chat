import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import IncomingCallModal from "../components/calls/IncomingCallModal";
import ConnectionBanner from "../components/ConnectionBanner";
import ServerRail from "../components/ServerRail";
import { useDms } from "../context/dms";
import { useToasts } from "../context/toasts";
import { useUnread } from "../context/unread";
import { sumFor } from "../lib/unreadReducer";
import { useSubscription } from "../realtime/hooks";

/** Squelette de l'application connectée : rail des serveurs + page courante. */
export default function AppShell() {
    const { pushToast } = useToasts();
    const { counts, mentions } = useUnread();
    const { conversations } = useDms();
    const unreadDms = sumFor(counts, conversations.map((c) => c.channelId));

    // Titre de l'onglet : « (3) Tangzer » quand on a des mentions ou des MP non lus.
    const attention = Object.values(mentions).reduce((a, b) => a + b, 0) + unreadDms;
    useEffect(() => {
        document.title = attention > 0 ? `(${attention}) Tangzer` : "Tangzer";
    }, [attention]);

    // Erreurs renvoyées par le serveur pour une action STOMP (message trop long…).
    useSubscription<{ message: string }>("/user/queue/errors", (error) => {
        pushToast(error.message, { tone: "error" });
    });

    // Sur téléphone : la liste des serveurs et des salons s'ouvre en tiroir (☰),
    // et se referme dès qu'on choisit un lien.
    const [navOpen, setNavOpen] = useState(false);

    return (
        <div
            className={navOpen ? "app-shell nav-open" : "app-shell"}
            onClickCapture={(e) => {
                if ((e.target as HTMLElement).closest("a")) {
                    setNavOpen(false);
                }
            }}
        >
            <button className="mobile-nav-button" onClick={() => setNavOpen((open) => !open)} aria-label="Menu">
                {navOpen ? "✕" : "☰"}
            </button>
            {navOpen && <div className="mobile-nav-backdrop" onClick={() => setNavOpen(false)} />}
            <ConnectionBanner />
            <ServerRail />
            <Outlet />
            <IncomingCallModal />
        </div>
    );
}
