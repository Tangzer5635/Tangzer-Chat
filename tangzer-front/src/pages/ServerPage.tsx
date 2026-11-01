import { Hash, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import ChannelView from "../components/chat/ChannelView";
import VoiceRoom from "../components/calls/VoiceRoom";
import MemberList from "../components/MemberList";
import { useServers } from "../context/servers";
import { getLastChannel, rememberChannel } from "../lib/lastVisited";
import { canManageServer } from "../lib/permissions";

const MEMBERS_KEY = "tangzer.showMembers";

/** /app/servers/:serverId/channels/:channelId */
export default function ServerPage() {
    const params = useParams();
    const serverId = Number(params.serverId);
    const channelId = params.channelId ? Number(params.channelId) : null;

    const { getServer, loaded } = useServers();
    const server = getServer(serverId);
    const channel = server?.channels.find((c) => c.id === channelId);

    // Sur écran étroit, les membres passent par-dessus la discussion : fermés au départ.
    const [showMembers, setShowMembers] = useState(() =>
        localStorage.getItem(MEMBERS_KEY) !== "false" && window.matchMedia("(min-width: 1101px)").matches);

    useEffect(() => {
        if (server && channel) {
            rememberChannel(server.id, channel.id);
        }
    }, [server, channel]);

    if (!loaded) {
        return <div className="page-loading">Chargement…</div>;
    }

    if (!server) {
        return (
            <div className="page-empty">
                <h2>Serveur introuvable</h2>
                <p>Tu n'es pas (ou plus) membre de ce serveur.</p>
                <Link to="/app" className="button-primary">Retour à l'accueil</Link>
            </div>
        );
    }

    // Pas de salon choisi (ou salon supprimé) : on ouvre le dernier visité ou le premier.
    if (!channel) {
        const fallback = server.channels.find((c) => c.id === getLastChannel(server.id))
            ?? server.channels.find((c) => c.type === "TEXT")
            ?? server.channels[0];
        return fallback
            ? <Navigate to={`/app/servers/${server.id}/channels/${fallback.id}`} replace />
            : <div className="page-empty"><p>Ce serveur n'a aucun salon.</p></div>;
    }

    const toggleMembers = () => {
        setShowMembers((visible) => {
            localStorage.setItem(MEMBERS_KEY, String(!visible));
            return !visible;
        });
    };

    if (channel.type === "VOICE") {
        return (
            <VoiceRoom key={channel.id} channel={channel} />
        );
    }

    return (
        <>
            <ChannelView
                key={channel.id}
                channelId={channel.id}
                canModerate={canManageServer(server.myRole)}
                placeholder={`Envoyer un message dans #${channel.name}`}
                label={`Messages de #${channel.name}`}
                header={
                    <>
                        <Hash className="chat-header-hash" size={22} />
                        <h1>{channel.name}</h1>
                        {channel.topic && <span className="chat-header-topic">{channel.topic}</span>}
                        <span className="spacer" />
                        <button
                            className="icon-button"
                            onClick={toggleMembers}
                            title={showMembers ? "Masquer les membres" : "Afficher les membres"}
                            aria-label="Liste des membres"
                            aria-pressed={showMembers}
                        >
                            <Users size={20} />
                        </button>
                    </>
                }
                welcome={
                    <div className="channel-welcome">
                        <div className="channel-welcome-icon" aria-hidden="true"><Hash size={36} /></div>
                        <h2>Bienvenue dans #{channel.name} !</h2>
                        <p>{channel.topic ?? "C'est le début de ce salon."}</p>
                    </div>
                }
            />
            {showMembers && <MemberList server={server} />}
        </>
    );
}
