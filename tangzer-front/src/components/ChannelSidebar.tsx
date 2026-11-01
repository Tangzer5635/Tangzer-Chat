import { useEffect, useRef, useState } from "react";
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

    const canManage = canManageServer(server.myRole);
    const textChannels = server.channels.filter((c) => c.type === "TEXT");
    const voiceChannels = server.channels.filter((c) => c.type === "VOICE");

    // Ferme le menu quand on clique ailleurs.
    useEffect(() => {
        if (!menuOpen) {
            return;
        }
        const onClick = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

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

    return (
        <aside className="sidebar">
            <div className="sidebar-header-wrapper" ref={menuRef}>
                <button className="sidebar-header" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
                    <span className="sidebar-title">{server.name}</span>
                    <span className="sidebar-chevron">{menuOpen ? "✕" : "▾"}</span>
                </button>

                {menuOpen && (
                    <div className="dropdown" role="menu">
                        <button className="dropdown-item accent" onClick={() => open({ kind: "invite" })}>
                            Inviter des gens <span>👋</span>
                        </button>
                        {canManage && (
                            <>
                                <button className="dropdown-item" onClick={() => open({ kind: "settings" })}>
                                    Paramètres du serveur <span>⚙️</span>
                                </button>
                                <button className="dropdown-item" onClick={() => open({ kind: "createChannel" })}>
                                    Créer un salon <span>➕</span>
                                </button>
                            </>
                        )}
                        {server.myRole !== "OWNER" && (
                            <>
                                <div className="dropdown-separator" />
                                <button className="dropdown-item danger" onClick={handleLeave}>
                                    Quitter le serveur <span>🚪</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="sidebar-scroll">
                {server.description && <p className="sidebar-description">{server.description}</p>}

                <div className="channel-category">
                    <span>Salons textuels</span>
                    {canManage && (
                        <button className="icon-button small" title="Créer un salon" onClick={() => open({ kind: "createChannel" })}>
                            +
                        </button>
                    )}
                </div>

                {textChannels.map((channel) => (
                    <NavLink
                        key={channel.id}
                        to={`/app/servers/${server.id}/channels/${channel.id}`}
                        className={({ isActive }) => [
                            "channel-item",
                            isActive ? "active" : "",
                            counts[channel.id] ? "unread" : "",
                        ].join(" ")}
                    >
                        <span className="channel-hash">#</span>
                        <span className="channel-name">{channel.name}</span>
                        {mentions[channel.id] > 0 && <span className="badge">{mentions[channel.id]}</span>}
                        {canManage && (
                            <button
                                className="channel-edit"
                                title="Modifier le salon"
                                onClick={(e) => {
                                    e.preventDefault();
                                    open({ kind: "editChannel", channel });
                                }}
                            >
                                ⚙
                            </button>
                        )}
                    </NavLink>
                ))}

                {voiceChannels.length > 0 && (
                    <div className="channel-category">
                        <span>Salons vocaux</span>
                        {canManage && (
                            <button className="icon-button small" title="Créer un salon" onClick={() => open({ kind: "createChannel" })}>
                                +
                            </button>
                        )}
                    </div>
                )}

                {voiceChannels.map((channel) => (
                    <div key={channel.id}>
                        <NavLink
                            to={`/app/servers/${server.id}/channels/${channel.id}`}
                            className={({ isActive }) => (isActive ? "channel-item active" : "channel-item")}
                            onClick={() => void join(channel.id)}
                            title="Rejoindre le salon vocal"
                        >
                            <span className="channel-hash">🔊</span>
                            <span className="channel-name">{channel.name}</span>
                            {canManage && (
                                <button
                                    className="channel-edit"
                                    title="Modifier le salon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        open({ kind: "editChannel", channel });
                                    }}
                                >
                                    ⚙
                                </button>
                            )}
                        </NavLink>
                        {(calls[channel.id]?.participants ?? []).map((participant) => (
                            <div
                                key={participant.user.id}
                                className={speaking.has(participant.user.id) && !participant.muted ? "voice-member speaking" : "voice-member"}
                            >
                                <Avatar user={participant.user} size={24} />
                                <span className="voice-member-name">{participant.user.displayName}</span>
                                {participant.deafened ? <small>🙉</small> : participant.muted ? <small>🔇</small> : null}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

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
