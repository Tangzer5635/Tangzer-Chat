import { Ellipsis, Hash, HeadphoneOff, LogOut, MicOff, Plus, Settings, UserPlus, Video, Volume2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { leaveServer } from "../../api/servers";
import { useCalls } from "../../context/calls";
import { useServers } from "../../context/servers";
import { useToasts } from "../../context/toasts";
import { useUnread } from "../../context/unread";
import { canManageServer } from "../../lib/permissions";
import { sumFor } from "../../lib/unreadReducer";
import type { Channel, Server } from "../../types/api";
import Avatar from "../Avatar";
import ChannelModal from "../modals/ChannelModal";
import InviteModal from "../modals/InviteModal";
import ServerSettingsModal from "../modals/ServerSettingsModal";
import ServerIcon from "../ServerIcon";
import { useDismiss } from "../ui/useDismiss";

type OpenModal =
    | { kind: "invite" }
    | { kind: "settings" }
    | { kind: "createChannel" }
    | { kind: "editChannel"; channel: Channel }
    | null;

/**
 * Un serveur dans la navigation. Le serveur ouvert se déplie : bouton
 * d'actions (inviter, paramètres, créer un salon, quitter) et liste des salons.
 */
export default function ServerSection({ server, current }: { server: Server; current: boolean }) {
    const navigate = useNavigate();
    const { dispatch } = useServers();
    const { pushToast } = useToasts();
    const { counts, mentions } = useUnread();
    const { calls, join, speaking } = useCalls();

    const [menuOpen, setMenuOpen] = useState(false);
    const [modal, setModal] = useState<OpenModal>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();
    useDismiss(menuOpen, () => setMenuOpen(false), menuRef, triggerRef);

    const channelIds = server.channels.map((c) => c.id);
    const unread = sumFor(counts, channelIds) > 0;
    const mentionCount = sumFor(mentions, channelIds);
    const canManage = canManageServer(server.myRole);
    const textChannels = server.channels.filter((c) => c.type === "TEXT");
    const voiceChannels = server.channels.filter((c) => c.type === "VOICE");

    const open = (next: OpenModal) => {
        setMenuOpen(false);
        setModal(next);
    };

    const handleLeave = async () => {
        setMenuOpen(false);
        if (!window.confirm(`Quitter « ${server.name} » ?`)) {
            return;
        }
        try {
            await leaveServer(server.id);
            dispatch({ type: "serverRemoved", serverId: server.id });
            navigate("/app");
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Impossible de quitter le serveur.", { tone: "error" });
        }
    };

    const editButton = (channel: Channel) => canManage && (
        <button
            type="button"
            className="channel-edit icon-button small"
            aria-label={`Modifier le salon ${channel.name}`}
            title="Modifier le salon"
            onClick={() => open({ kind: "editChannel", channel })}
        >
            <Settings size={16} />
        </button>
    );

    const createButton = canManage && (
        <button className="icon-button small" aria-label="Créer un salon" title="Créer un salon" onClick={() => open({ kind: "createChannel" })}>
            <Plus size={16} />
        </button>
    );

    return (
        <li className={current ? "nav-server current" : "nav-server"}>
            <div className="nav-server-row">
                <NavLink to={`/app/servers/${server.id}`} className={unread && !current ? "nav-link unread" : "nav-link"}>
                    <ServerIcon server={server} size={28} />
                    <span className="nav-label">{server.name}</span>
                    {!current && mentionCount > 0 && (
                        <span className="badge">
                            {mentionCount > 99 ? "99+" : mentionCount}
                            <span className="sr-only"> mention{mentionCount > 1 ? "s" : ""}</span>
                        </span>
                    )}
                    {!current && unread && mentionCount === 0 && <span className="unread-dot" role="img" aria-label="Non lu" />}
                </NavLink>
                {current && (
                    <button
                        ref={triggerRef}
                        className="icon-button small nav-server-menu"
                        aria-label={`Actions du serveur ${server.name}`}
                        title="Actions du serveur"
                        aria-expanded={menuOpen}
                        aria-controls={menuId}
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <Ellipsis size={18} />
                    </button>
                )}
                {menuOpen && (
                    <div className="dropdown nav-server-dropdown" id={menuId} ref={menuRef}>
                        <button className="dropdown-item accent" onClick={() => open({ kind: "invite" })}>
                            <UserPlus size={18} /> Inviter des personnes
                        </button>
                        {canManage && (
                            <>
                                <button className="dropdown-item" onClick={() => open({ kind: "settings" })}>
                                    <Settings size={18} /> Paramètres du serveur
                                </button>
                                <button className="dropdown-item" onClick={() => open({ kind: "createChannel" })}>
                                    <Plus size={18} /> Créer un salon
                                </button>
                            </>
                        )}
                        {server.myRole !== "OWNER" && (
                            <>
                                <div className="dropdown-separator" />
                                <button className="dropdown-item danger" onClick={handleLeave}>
                                    <LogOut size={18} /> Quitter le serveur
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {current && (
                <div className="nav-channels">
                    <div className="channel-category">
                        <h3>Salons textuels</h3>
                        {createButton}
                    </div>
                    <ul className="channel-list">
                        {textChannels.map((channel) => (
                            <li key={channel.id} className="channel-row">
                                <NavLink
                                    to={`/app/servers/${server.id}/channels/${channel.id}`}
                                    className={({ isActive }) => ["channel-item", isActive ? "active" : "", counts[channel.id] ? "unread" : ""].join(" ")}
                                >
                                    <Hash className="channel-hash" size={18} />
                                    <span className="channel-name">{channel.name}</span>
                                    {counts[channel.id] > 0 && !mentions[channel.id] && <span className="sr-only">(non lu)</span>}
                                    {mentions[channel.id] > 0 && (
                                        <span className="badge">
                                            {mentions[channel.id]}
                                            <span className="sr-only"> mention{mentions[channel.id] > 1 ? "s" : ""}</span>
                                        </span>
                                    )}
                                </NavLink>
                                {editButton(channel)}
                            </li>
                        ))}
                    </ul>

                    {voiceChannels.length > 0 && (
                        <div className="channel-category">
                            <h3>Salons vocaux</h3>
                            {createButton}
                        </div>
                    )}
                    <ul className="channel-list">
                        {voiceChannels.map((channel) => {
                            const participants = calls[channel.id]?.participants ?? [];
                            return (
                                <li key={channel.id} className="channel-row">
                                    <NavLink
                                        to={`/app/servers/${server.id}/channels/${channel.id}`}
                                        className={({ isActive }) => (isActive ? "channel-item active" : "channel-item")}
                                        onClick={() => void join(channel.id)}
                                    >
                                        <Volume2 className="channel-hash" size={18} />
                                        <span className="channel-name">{channel.name}</span>
                                        <span className="sr-only">
                                            (salon vocal{participants.length > 0 ? `, ${participants.length} personne${participants.length > 1 ? "s" : ""}` : ""})
                                        </span>
                                    </NavLink>
                                    {editButton(channel)}
                                    {participants.length > 0 && (
                                        <ul className="voice-members">
                                            {participants.map((participant) => (
                                                <li
                                                    key={participant.user.id}
                                                    className={speaking.has(participant.user.id) && !participant.muted ? "voice-member speaking" : "voice-member"}
                                                >
                                                    <Avatar user={participant.user} size={24} />
                                                    <span className="voice-member-name">{participant.user.displayName}</span>
                                                    {participant.screen && <span className="live-badge">En direct</span>}
                                                    {participant.video && <Video size={14} role="img" aria-label="Caméra allumée" />}
                                                    {participant.deafened
                                                        ? <HeadphoneOff size={14} role="img" aria-label="Son coupé" />
                                                        : participant.muted ? <MicOff size={14} role="img" aria-label="Micro coupé" /> : null}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {modal?.kind === "invite" && <InviteModal server={server} onClose={() => setModal(null)} />}
            {modal?.kind === "settings" && <ServerSettingsModal server={server} onClose={() => setModal(null)} />}
            {modal?.kind === "createChannel" && <ChannelModal serverId={server.id} onClose={() => setModal(null)} />}
            {modal?.kind === "editChannel" && (
                <ChannelModal serverId={server.id} channel={modal.channel} onClose={() => setModal(null)} />
            )}
        </li>
    );
}
