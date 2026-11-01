import { Hash, MessageSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { discoverServers, joinServer } from "../api/servers";
import { searchUsers } from "../api/users";
import { useAuth } from "../context/auth";
import { useDms } from "../context/dms";
import { useServers } from "../context/servers";
import { useToasts } from "../context/toasts";
import { searchMyChannels } from "../lib/quickSearch";
import type { DiscoverServer, User } from "../types/api";
import Avatar from "./Avatar";
import Modal from "./Modal";
import ServerIcon from "./ServerIcon";
import Field from "./ui/Field";

/**
 * Recherche rapide (bouton de l'en-tête ou Ctrl+K) : une personne à qui écrire,
 * un de mes salons, ou un serveur public. Reprend les recherches existantes.
 */
export default function QuickSearch({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const { servers, dispatch } = useServers();
    const { openWith } = useDms();
    const { pushToast } = useToasts();
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [people, setPeople] = useState<User[]>([]);
    const [publicServers, setPublicServers] = useState<DiscoverServer[]>([]);
    const channels = searchMyChannels(servers, query);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
            searchUsers(query)
                .then((users) => !cancelled && setPeople(users.filter((u) => u.id !== user?.id).slice(0, 6)))
                .catch(() => !cancelled && setPeople([]));
            discoverServers(query)
                .then((found) => !cancelled && setPublicServers(found.filter((s) => !s.joined).slice(0, 6)))
                .catch(() => !cancelled && setPublicServers([]));
        }, 200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, user?.id]);

    const go = (path: string) => {
        onClose();
        navigate(path);
    };

    const writeTo = async (other: User) => {
        try {
            go(`/app/dm/${(await openWith(other.id)).channelId}`);
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Conversation impossible.", { tone: "error" });
        }
    };

    const joinPublic = async (server: DiscoverServer) => {
        try {
            dispatch({ type: "serverUpserted", server: await joinServer(server.id) });
            go(`/app/servers/${server.id}`);
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Impossible de rejoindre ce serveur.", { tone: "error" });
        }
    };

    const total = people.length + channels.length + publicServers.length;

    return (
        <Modal title="Rechercher" onClose={onClose} wide>
            <div className="form quick-search">
                <Field label="Personne, salon ou serveur public" hint="Par exemple « tanguy », « général » ou « photo ».">
                    {(control) => (
                        <input {...control} type="text" enterKeyHint="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
                    )}
                </Field>

                <p className="sr-only" aria-live="polite">{query ? `${total} résultat${total > 1 ? "s" : ""}` : ""}</p>

                {channels.length > 0 && (
                    <section className="search-group" aria-labelledby="recherche-salons">
                        <h3 id="recherche-salons"><Hash size={16} /> Mes salons</h3>
                        <ul>
                            {channels.map(({ server, channel }) => (
                                <li key={channel.id}>
                                    <button className="search-result" onClick={() => go(`/app/servers/${server.id}/channels/${channel.id}`)}>
                                        <ServerIcon server={server} size={28} />
                                        <span>
                                            <strong>#{channel.name}</strong>
                                            <small>{server.name}</small>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {people.length > 0 && (
                    <section className="search-group" aria-labelledby="recherche-personnes">
                        <h3 id="recherche-personnes"><MessageSquare size={16} /> Écrire à</h3>
                        <ul>
                            {people.map((person) => (
                                <li key={person.id}>
                                    <button className="search-result" onClick={() => void writeTo(person)}>
                                        <Avatar user={person} size={28} />
                                        <span>
                                            <strong>{person.displayName}</strong>
                                            <small>@{person.username}</small>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {publicServers.length > 0 && (
                    <section className="search-group" aria-labelledby="recherche-serveurs">
                        <h3 id="recherche-serveurs"><Users size={16} /> Serveurs publics à rejoindre</h3>
                        <ul>
                            {publicServers.map((server) => (
                                <li key={server.id}>
                                    <button className="search-result" onClick={() => void joinPublic(server)}>
                                        <ServerIcon server={server} size={28} />
                                        <span>
                                            <strong>{server.name}</strong>
                                            <small>{server.memberCount} membre{server.memberCount > 1 ? "s" : ""} · Rejoindre</small>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {query && total === 0 && <p className="form-hint">Aucun résultat pour « {query} ».</p>}
            </div>
        </Modal>
    );
}
