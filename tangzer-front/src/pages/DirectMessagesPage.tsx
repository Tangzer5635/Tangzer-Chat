import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { searchUsers } from "../api/users";
import Avatar from "../components/Avatar";
import ChannelView from "../components/chat/ChannelView";
import DmSidebar from "../components/DmSidebar";
import { useAuth } from "../context/auth";
import { useDms } from "../context/dms";
import { useToasts } from "../context/toasts";
import type { User } from "../types/api";

/** Accueil des MP : quelques personnes à qui écrire. */
function DmHome() {
    const { user } = useAuth();
    const { openWith } = useDms();
    const { pushToast } = useToasts();
    const navigate = useNavigate();
    const [people, setPeople] = useState<User[]>([]);

    useEffect(() => {
        searchUsers("").then((users) => setPeople(users.filter((u) => u.id !== user?.id))).catch(() => undefined);
    }, [user?.id]);

    const start = async (other: User) => {
        try {
            navigate(`/app/dm/${(await openWith(other.id)).channelId}`);
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Conversation impossible.", { tone: "error" });
        }
    };

    return (
        <section className="chat dm-home">
            <header className="chat-header"><h1>👋 Accueil</h1></header>
            <div className="dm-home-body">
                <h2>Tes messages privés</h2>
                <p>Écris à quelqu'un en privé : réponses, réactions, mise en forme… tout marche comme dans les salons.</p>
                <div className="people-grid">
                    {people.map((person) => (
                        <button key={person.id} className="person-card" onClick={() => start(person)}>
                            <Avatar user={person} size={56} />
                            <strong>{person.displayName}</strong>
                            <small>@{person.username}</small>
                            <span className="person-card-action">Envoyer un message</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** /app/dm et /app/dm/:channelId */
export default function DirectMessagesPage() {
    const params = useParams();
    const channelId = params.channelId ? Number(params.channelId) : null;
    const { getConversation, loaded } = useDms();
    const conversation = channelId ? getConversation(channelId) : undefined;

    return (
        <>
            <DmSidebar />
            {!channelId ? (
                <DmHome />
            ) : !loaded ? (
                <div className="page-loading">Chargement…</div>
            ) : !conversation ? (
                <div className="page-empty">
                    <h2>Conversation introuvable</h2>
                    <Link to="/app/dm" className="button-primary">Retour aux messages privés</Link>
                </div>
            ) : (
                <ChannelView
                    key={conversation.channelId}
                    channelId={conversation.channelId}
                    canModerate={false}
                    partner={conversation.otherUser}
                    partnerReadId={conversation.otherLastReadMessageId}
                    placeholder={`Envoyer un message à @${conversation.otherUser.username}`}
                    header={
                        <>
                            <Avatar user={conversation.otherUser} size={24} />
                            <h1>{conversation.otherUser.displayName}</h1>
                            <span className="chat-header-topic">@{conversation.otherUser.username}</span>
                        </>
                    }
                    welcome={
                        <div className="channel-welcome">
                            <Avatar user={conversation.otherUser} size={80} />
                            <h2>{conversation.otherUser.displayName}</h2>
                            <p>C'est le début de ta conversation privée avec <strong>@{conversation.otherUser.username}</strong>.</p>
                        </div>
                    }
                />
            )}
        </>
    );
}
