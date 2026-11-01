import { Link } from "react-router-dom";

import { useCalls } from "../../context/calls";
import { useDms } from "../../context/dms";
import { useServers } from "../../context/servers";
import CallControls from "./CallControls";

/** Bandeau « Connecté au vocal » en bas de la barre latérale. */
export default function CallPanel() {
    const { current, calls, connecting } = useCalls();
    const { getServer } = useServers();
    const { getConversation } = useDms();

    if (!current) {
        return null;
    }

    const server = current.serverId ? getServer(current.serverId) : undefined;
    const channel = server?.channels.find((c) => c.id === current.channelId);
    const conversation = server ? undefined : getConversation(current.channelId);

    const where = server
        ? `${channel?.name ?? "vocal"} / ${server.name}`
        : conversation ? `Appel avec ${conversation.otherUser.displayName}` : "Appel privé";
    const link = server ? `/app/servers/${server.id}/channels/${current.channelId}` : `/app/dm/${current.channelId}`;
    const count = calls[current.channelId]?.participants.length ?? 1;

    return (
        <div className="call-panel">
            <div className="call-panel-info">
                <strong className="call-panel-status">{connecting ? "Connexion…" : "🔊 Connecté au vocal"}</strong>
                <Link to={link} className="call-panel-where">{where} · {count} 👤</Link>
            </div>
            <CallControls />
        </div>
    );
}
