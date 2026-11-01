import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/auth";
import { useDms } from "../context/dms";
import { usePresence } from "../context/presence";
import { useUnread } from "../context/unread";
import { toPlainText } from "../lib/markdown";
import Avatar from "./Avatar";
import CallPanel from "./calls/CallPanel";
import NewDmModal from "./modals/NewDmModal";
import UserPanel from "./UserPanel";

/** Barre latérale de l'accueil : mes conversations privées. */
export default function DmSidebar() {
    const { user } = useAuth();
    const { conversations } = useDms();
    const { counts } = useUnread();
    const { statusOf } = usePresence();
    const [creating, setCreating] = useState(false);

    return (
        <aside className="sidebar">
            <div className="sidebar-header static">
                <span className="sidebar-title">Messages privés</span>
                <button className="icon-button small" title="Nouveau message" onClick={() => setCreating(true)}>+</button>
            </div>

            <div className="sidebar-scroll">
                {conversations.length === 0 && (
                    <p className="sidebar-description">Aucune conversation pour l'instant. Clique sur + pour écrire à quelqu'un.</p>
                )}
                {conversations.map((conversation) => {
                    const unread = counts[conversation.channelId] ?? 0;
                    const last = conversation.lastMessage;
                    return (
                        <NavLink
                            key={conversation.channelId}
                            to={`/app/dm/${conversation.channelId}`}
                            className={({ isActive }) => ["dm-item", isActive ? "active" : "", unread ? "unread" : ""].join(" ")}
                        >
                            <Avatar user={conversation.otherUser} size={32} status={statusOf(conversation.otherUser.id)} />
                            <span className="dm-item-text">
                                <strong>{conversation.otherUser.displayName}</strong>
                                <small>
                                    {last
                                        ? `${last.author.id === user?.id ? "Toi : " : ""}${toPlainText(last.content) || "Photo"}`
                                        : `@${conversation.otherUser.username}`}
                                </small>
                            </span>
                            {unread > 0 && <span className="badge">{unread > 99 ? "99+" : unread}</span>}
                        </NavLink>
                    );
                })}
            </div>

            <CallPanel />
            <UserPanel />
            {creating && <NewDmModal onClose={() => setCreating(false)} />}
        </aside>
    );
}
