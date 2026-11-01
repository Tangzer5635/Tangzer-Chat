import { ChevronDown, Hash, HeadphoneOff, LogOut, MicOff, Plus, Settings, UserPlus, Video, Volume2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { leaveServer } from "../api/servers";
import { useCalls } from "../context/calls";
import { useServers } from "../context/servers";
import { useToasts } from "../context/toasts";
import { useUnread } from "../context/unread";
import { canManageServer } from "../lib/permissions";
import type { Channel, Server } from "../types/api";
import Avatar from "./Avatar";
import CallPanel from "./calls/CallPanel";
import ChannelModal from "./modals/ChannelModal";
import InviteModal from "./modals/InviteModal";
import ServerSettingsModal from "./modals/ServerSettingsModal";
import { useDismiss } from "./ui/useDismiss";
import UserPanel from "./UserPanel";

type OpenModal =
    | { kind: "invite" }
    | { kind: "settings" }
    | { kind: "createChannel" }
    | { kind: "editChannel"; channel: Channel }
    | null;

/** Barre latérale d'un serveur : menu du serveur et liste des salons. */
export default function ChannelSidebar({ server }: { server: Server }) {
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

    const canManage = canManageServer(server.myRole);
    const textChannels = server.channels.filter((c) => c.type === "TEXT");
    const voiceChannels = server.channels.filter((c) => c.type === "VOICE");

    useDismiss(menuOpen, () => setMenuOpen(false), menuRef, triggerRef);

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

    return (
        <aside className="sidebar">
            <div className="sidebar-header-wrapper">
                <button
                    ref={triggerRef}
                    className="sidebar-header"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    aria-controls={menuId}
                >
                    <span className="sidebar-title">{server.name}</span>
                    <ChevronDown className={menuOpen ? "sidebar-chevron open" : "sidebar-chevron"} size={18} />
                    <span className="sr-only">: actions du serveur</span>
                </button>

                {menuOpen && (
                    <div className="dropdown" id={menuId} ref={menuRef}>
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

            <nav className="sidebar-scroll" aria-label={`Salons de ${server.name}`}>
                {server.description && <p className="sidebar-description">{server.description}</p>}

                <div className="channel-category">
                    <h2>Salons textuels</h2>
                    {canManage && (
                        <button className="icon-button small" aria-label="Créer un salon" title="Créer un salon" onClick={() => open({ kind: "createChannel" })}>
                            <Plus size={16} />
                        </button>
                    )}
                </div>

                <ul className="channel-list">
                    {textChannels.map((channel) => (
                        <li key={channel.id} className="channel-row">
                            <NavLink
                                to={`/app/servers/${server.id}/channels/${channel.id}`}
                                className={({ isActive }) => [
                                    "channel-item",
                                    isActive ? "active" : "",
                                    counts[channel.id] ? "unread" : "",
                                ].join(" ")}
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
                        <h2>Salons vocaux</h2>
                        {canManage && (
                            <button className="icon-button small" aria-label="Créer un salon" title="Créer un salon" onClick={() => open({ kind: "createChannel" })}>
                                <Plus size={16} />
                            </button>
                        )}
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
            </nav>

            <CallPanel />
            <UserPanel />

            {modal?.kind === "invite" && <InviteModal server={server} onClose={() => setModal(null)} />}
            {modal?.kind === "settings" && <ServerSettingsModal server={server} onClose={() => setModal(null)} />}
            {modal?.kind === "createChannel" && <ChannelModal serverId={server.id} onClose={() => setModal(null)} />}
            {modal?.kind === "editChannel" && (
                <ChannelModal serverId={server.id} channel={modal.channel} onClose={() => setModal(null)} />
            )}
        </aside>
    );
}
