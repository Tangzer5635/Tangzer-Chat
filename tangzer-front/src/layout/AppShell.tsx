import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AppHeader from "../components/AppHeader";
import IncomingCallModal from "../components/calls/IncomingCallModal";
import ConnectionBanner from "../components/ConnectionBanner";
import AppNav from "../components/nav/AppNav";
import QuickSearch from "../components/QuickSearch";
import { useDms } from "../context/dms";
import { useToasts } from "../context/toasts";
import { useUnread } from "../context/unread";
import { APP_NAME } from "../lib/brand";
import { sumFor } from "../lib/unreadReducer";
import { useSubscription } from "../realtime/hooks";

const NAV_ID = "navigation-principale";

/**
 * Squelette de l'application connectée :
 * lien d'évitement, en-tête, navigation à gauche, contenu au centre.
 */
export default function AppShell() {
    const { pushToast } = useToasts();
    const { counts, mentions } = useUnread();
    const { conversations } = useDms();
    const location = useLocation();
    const unreadDms = sumFor(counts, conversations.map((c) => c.channelId));

    // Titre de l'onglet : « (3) Préau » quand on a des mentions ou des MP non lus.
    const attention = Object.values(mentions).reduce((a, b) => a + b, 0) + unreadDms;
    useEffect(() => {
        document.title = attention > 0 ? `(${attention}) ${APP_NAME}` : APP_NAME;
    }, [attention]);

    // Erreurs renvoyées par le serveur pour une action STOMP (message trop long…).
    useSubscription<{ message: string }>("/user/queue/errors", (error) => {
        pushToast(error.message, { tone: "error" });
    });

    // Sur téléphone, la navigation s'ouvre en tiroir et se referme à chaque changement de page.
    const [navOpen, setNavOpen] = useState(false);
    const [navPath, setNavPath] = useState(location.pathname);
    if (navPath !== location.pathname) {
        setNavPath(location.pathname);
        setNavOpen(false);
    }

    // Recherche rapide : bouton de l'en-tête ou Ctrl+K (Cmd+K sur Mac).
    const [searchOpen, setSearchOpen] = useState(false);
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <div className={navOpen ? "app-shell nav-open" : "app-shell"}>
            <a
                className="skip-link"
                href="#contenu"
                onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("contenu")?.focus();
                }}
            >
                Aller au contenu
            </a>
            <ConnectionBanner />
            <AppHeader navOpen={navOpen} onToggleNav={() => setNavOpen((open) => !open)} onSearch={() => setSearchOpen(true)} navId={NAV_ID} />
            <div className="app-body">
                <AppNav id={NAV_ID} />
                {navOpen && <div className="mobile-nav-backdrop" onClick={() => setNavOpen(false)} />}
                <main id="contenu" className="app-main" tabIndex={-1}>
                    <Outlet />
                </main>
            </div>
            <IncomingCallModal />
            {searchOpen && <QuickSearch onClose={() => setSearchOpen(false)} />}
        </div>
    );
}
