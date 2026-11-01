import { Compass, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { NavLink, useMatch } from "react-router-dom";

import { useDms } from "../../context/dms";
import { useServers } from "../../context/servers";
import { useUnread } from "../../context/unread";
import { sumFor } from "../../lib/unreadReducer";
import CallPanel from "../calls/CallPanel";
import CreateServerModal from "../modals/CreateServerModal";
import DmConversations from "./DmConversations";
import ServerSection from "./ServerSection";

/**
 * Navigation principale (colonne de gauche) : messages privés, Explorer,
 * puis mes serveurs avec leur nom en clair. La rubrique ouverte se déplie.
 */
export default function AppNav({ id }: { id: string }) {
    const { servers } = useServers();
    const { conversations } = useDms();
    const { counts } = useUnread();
    const [creating, setCreating] = useState(false);

    const inDms = useMatch("/app/dm/*") !== null;
    const serverMatch = useMatch("/app/servers/:serverId/*");
    const currentServerId = serverMatch ? Number(serverMatch.params.serverId) : null;
    const unreadDms = sumFor(counts, conversations.map((c) => c.channelId));

    return (
        <nav className="app-nav" id={id} aria-label="Navigation principale">
            <div className="app-nav-scroll">
                <ul className="nav-list">
                    <li className={inDms ? "nav-server current" : "nav-server"}>
                        <NavLink to="/app/dm" className={unreadDms > 0 && !inDms ? "nav-link unread" : "nav-link"}>
                            <MessageSquare className="nav-icon" size={20} />
                            <span className="nav-label">Messages privés</span>
                            {unreadDms > 0 && (
                                <span className="badge">
                                    {unreadDms > 99 ? "99+" : unreadDms}
                                    <span className="sr-only"> non lu{unreadDms > 1 ? "s" : ""}</span>
                                </span>
                            )}
                        </NavLink>
                        {inDms && <DmConversations />}
                    </li>
                    <li>
                        <NavLink to="/app/explore" className="nav-link">
                            <Compass className="nav-icon" size={20} />
                            <span className="nav-label">Explorer les serveurs</span>
                        </NavLink>
                    </li>
                </ul>

                <div className="nav-section-header">
                    <h2>Mes serveurs</h2>
                    <button
                        className="icon-button small"
                        aria-label="Créer ou rejoindre un serveur"
                        title="Créer ou rejoindre un serveur"
                        onClick={() => setCreating(true)}
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <ul className="nav-list">
                    {servers.map((server) => (
                        <ServerSection key={server.id} server={server} current={server.id === currentServerId} />
                    ))}
                </ul>
                {servers.length === 0 && (
                    <p className="nav-empty">
                        Aucun serveur. <button className="link-button" onClick={() => setCreating(true)}>Créer ou rejoindre un serveur</button>
                    </p>
                )}
            </div>

            <CallPanel />
            {creating && <CreateServerModal onClose={() => setCreating(false)} />}
        </nav>
    );
}
