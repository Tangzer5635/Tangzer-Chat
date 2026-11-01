import { SquarePen } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/auth";
import { useDms } from "../../context/dms";
import { usePresence } from "../../context/presence";
import { useUnread } from "../../context/unread";
import { toPlainText } from "../../lib/markdown";
import Avatar from "../Avatar";
import NewDmModal from "../modals/NewDmModal";

/** Sous « Messages privés » : mes conversations, et un bouton pour en commencer une. */
export default function DmConversations() {
    const { user } = useAuth();
    const { conversations } = useDms();
    const { counts } = useUnread();
    const { statusOf } = usePresence();
    const [creating, setCreating] = useState(false);

    return (
        <div className="nav-channels">
            <button className="button-link nav-new-dm" onClick={() => setCreating(true)}>
                <SquarePen size={16} /> Nouveau message
            </button>
            {conversations.length === 0 && (
                <p className="nav-empty">Aucune conversation pour l'instant.</p>
            )}
            <ul className="channel-list">
                {conversations.map((conversation) => {
                    const unread = counts[conversation.channelId] ?? 0;
                    const last = conversation.lastMessage;
                    return (
                        <li key={conversation.channelId}>
                            <NavLink
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
                                {unread > 0 && (
                                    <span className="badge">
                                        {unread > 99 ? "99+" : unread}
                                        <span className="sr-only"> non lu{unread > 1 ? "s" : ""}</span>
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
            {creating && <NewDmModal onClose={() => setCreating(false)} />}
        </div>
    );
}
