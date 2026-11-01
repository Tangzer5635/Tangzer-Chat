import { Compass, Plus } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useDms } from "../context/dms";
import { useServers } from "../context/servers";
import { useUnread } from "../context/unread";
import { sumFor } from "../lib/unreadReducer";
import CreateServerModal from "./modals/CreateServerModal";
import ServerIcon from "./ServerIcon";
import Logo from "./Logo";

/** Colonne de gauche : messages privés, mes serveurs, créer, explorer. */
export default function ServerRail() {
    const { servers } = useServers();
    const { conversations } = useDms();
    const { counts, mentions } = useUnread();
    const unreadCount = sumFor(counts, conversations.map((c) => c.channelId));
    const [creating, setCreating] = useState(false);

    const railClass = ({ isActive }: { isActive: boolean }) => (isActive ? "rail-item active" : "rail-item");

    return (
        <nav className="server-rail" aria-label="Serveurs">
            <NavLink to="/app/dm" className={railClass} data-tooltip="Messages privés" aria-label={unreadCount > 0 ? `Messages privés, ${unreadCount} non lu${unreadCount > 1 ? "s" : ""}` : "Messages privés"}>
                <span className="rail-home">
                    <Logo size={28} />
                </span>
                {unreadCount > 0 && <span className="rail-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </NavLink>

            <div className="rail-separator" />

            {servers.map((server) => {
                const channelIds = server.channels.map((c) => c.id);
                const unread = sumFor(counts, channelIds) > 0;
                const mentionCount = sumFor(mentions, channelIds);
                return (
                    <NavLink
                        key={server.id}
                        to={`/app/servers/${server.id}`}
                        className={({ isActive }) => `${railClass({ isActive })}${unread ? " unread" : ""}`}
                        data-tooltip={server.name}
                        aria-label={mentionCount > 0 ? `${server.name}, ${mentionCount} mention${mentionCount > 1 ? "s" : ""}` : unread ? `${server.name}, non lu` : server.name}
                    >
                        <ServerIcon server={server} />
                        {mentionCount > 0 && <span className="rail-badge">{mentionCount > 99 ? "99+" : mentionCount}</span>}
                    </NavLink>
                );
            })}

            <button className="rail-item rail-action" onClick={() => setCreating(true)} data-tooltip="Créer un serveur" aria-label="Créer un serveur">
                <span className="rail-action-icon"><Plus size={24} /></span>
            </button>

            <NavLink to="/app/explore" className={({ isActive }) => `${railClass({ isActive })} rail-action`} data-tooltip="Explorer les serveurs publics" aria-label="Explorer les serveurs publics">
                <span className="rail-action-icon"><Compass size={24} /></span>
            </NavLink>

            {creating && <CreateServerModal onClose={() => setCreating(false)} />}
        </nav>
    );
}
