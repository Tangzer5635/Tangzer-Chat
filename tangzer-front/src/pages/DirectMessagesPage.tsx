import { Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { searchUsers } from "../api/users";
import Avatar from "../components/Avatar";
import ChannelView from "../components/chat/ChannelView";
import CallControls from "../components/calls/CallControls";
import CallTiles from "../components/calls/CallTiles";
import { useAuth } from "../context/auth";
import { useCalls } from "../context/calls";
import { useDms } from "../context/dms";
import { usePresence } from "../context/presence";
import { useToasts } from "../context/toasts";
import { STATUS_LABELS } from "../lib/presence";
import type { User } from "../types/api";

/** Accueil des MP : quelques personnes à qui écrire. */
function DmHome() {
    const { user } = useAuth();
    const { openWith } = useDms();
    const { pushToast } = useToasts();
    const { statusOf } = usePresence();
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
            <header className="chat-header"><h1>Accueil</h1></header>
            <div className="dm-home-body">
                <h2>Tes messages privés</h2>
                <p>Écris à quelqu'un en privé : réponses, réactions, mise en forme… tout marche comme dans les salons.</p>
                <div className="people-grid">
                    {people.map((person) => (
                        <button key={person.id} className="person-card" onClick={() => start(person)}>
                            <Avatar user={person} size={56} status={statusOf(person.id)} />
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
    const { getConversation, loaded, refresh } = useDms();
    const { statusOf, customStatusOf } = usePresence();
    const { calls, current, join, connecting } = useCalls();
    const conversation = channelId ? getConversation(channelId) : undefined;
    const call = channelId ? calls[channelId] : undefined;
    const inThisCall = current?.channelId === channelId;

    // Lien vers une conversation pas encore dans ma liste (créée par l'autre) : on recharge une fois.
    const refreshedFor = useRef<number | null>(null);
    useEffect(() => {
        if (loaded && channelId && !conversation && refreshedFor.current !== channelId) {
            refreshedFor.current = channelId;
            void refresh();
        }
    }, [loaded, channelId, conversation, refresh]);

    return (
        <>
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
                    banner={call && (
                        <div className="call-stage">
                            <CallTiles participants={call.participants} />
                            <div className="call-stage-actions">
                                {inThisCall
                                    ? <CallControls large />
                                    : <button className="button-success" onClick={() => void join(conversation.channelId)}>Rejoindre l'appel</button>}
                            </div>
                        </div>
                    )}
                    key={conversation.channelId}
                    channelId={conversation.channelId}
                    canModerate={false}
                    partner={conversation.otherUser}
                    partnerReadId={conversation.otherLastReadMessageId}
                    placeholder={`Envoyer un message à @${conversation.otherUser.username}`}
                    label={`Conversation avec ${conversation.otherUser.displayName}`}
                    header={
                        <>
                            <Avatar user={conversation.otherUser} size={24} status={statusOf(conversation.otherUser.id)} />
                            <h1>{conversation.otherUser.displayName}</h1>
                            <span className="chat-header-topic">
                                {customStatusOf(conversation.otherUser.id) ?? STATUS_LABELS[statusOf(conversation.otherUser.id)]}
                            </span>
                            <span className="spacer" />
                            {!call && (
                                <button
                                    className="icon-button"
                                    title="Démarrer un appel vocal"
                                    aria-label="Démarrer un appel vocal"
                                    disabled={connecting}
                                    onClick={() => void join(conversation.channelId)}
                                >
                                    <Phone size={20} />
                                </button>
                            )}
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
