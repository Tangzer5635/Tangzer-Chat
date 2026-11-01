import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useDirectMessages } from "../context/directMessages";
import { useServers } from "../context/servers";
import CreateServerModal from "./modals/CreateServerModal";
import ServerIcon from "./ServerIcon";

/** Colonne de gauche : messages privés, mes serveurs, créer, explorer. */
export default function ServerRail() {
    const { servers } = useServers();
    const { unreadCount } = useDirectMessages();
    const [creating, setCreating] = useState(false);

    const railClass = ({ isActive }: { isActive: boolean }) => (isActive ? "rail-item active" : "rail-item");

    return (
        <nav className="server-rail" aria-label="Serveurs">
            <NavLink to="/app/dm" className={railClass} data-tooltip="Messages privés">
                <span className="rail-home">
                    <img src="/favicon.jpg" alt="" />
                </span>
                {unreadCount > 0 && <span className="rail-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </NavLink>

            <div className="rail-separator" />

            {servers.map((server) => (
                <NavLink
                    key={server.id}
                    to={`/app/servers/${server.id}`}
                    className={railClass}
                    data-tooltip={server.name}
                >
                    <ServerIcon server={server} />
                </NavLink>
            ))}

            <button className="rail-item rail-action" onClick={() => setCreating(true)} data-tooltip="Créer un serveur">
                <span className="rail-action-icon">+</span>
            </button>

            <NavLink to="/app/explore" className={({ isActive }) => `${railClass({ isActive })} rail-action`} data-tooltip="Explorer les serveurs publics">
                <span className="rail-action-icon">🧭</span>
            </NavLink>

            {creating && <CreateServerModal onClose={() => setCreating(false)} />}
        </nav>
    );
}
