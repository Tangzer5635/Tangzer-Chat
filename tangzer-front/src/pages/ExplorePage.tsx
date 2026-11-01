import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { discoverServers, joinServer } from "../api/servers";
import ServerIcon from "../components/ServerIcon";
import { useServers } from "../context/servers";
import { useToasts } from "../context/toasts";
import type { DiscoverServer } from "../types/api";
import { APP_NAME } from "../lib/brand";

/** /app/explore : les serveurs publics, avec recherche. */
export default function ExplorePage() {
    const navigate = useNavigate();
    const { dispatch } = useServers();
    const { pushToast } = useToasts();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<DiscoverServer[] | null>(null);

    // Petite attente après la frappe pour ne pas interroger le serveur à chaque lettre.
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
            discoverServers(query)
                .then((servers) => !cancelled && setResults(servers))
                .catch(() => !cancelled && setResults([]));
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const open = async (server: DiscoverServer) => {
        if (!server.joined) {
            try {
                const joined = await joinServer(server.id);
                dispatch({ type: "serverUpserted", server: joined });
                pushToast(`Bienvenue sur ${server.name} !`, { tone: "success" });
            } catch (err) {
                pushToast(err instanceof Error ? err.message : "Impossible de rejoindre ce serveur.", { tone: "error" });
                return;
            }
        }
        navigate(`/app/servers/${server.id}`);
    };

    return (
        <main className="explore">
            <section className="explore-hero">
                <h1>Trouve ta communauté sur {APP_NAME}</h1>
                <p>Des serveurs publics, ouverts à tous. Rejoins-en un en un clic.</p>
                <input
                    className="explore-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="🔍  Rechercher un serveur"
                    autoFocus
                />
            </section>

            {results === null ? (
                <p className="page-loading">Recherche…</p>
            ) : results.length === 0 ? (
                <p className="explore-empty">Aucun serveur public ne correspond à « {query} ».</p>
            ) : (
                <div className="explore-grid">
                    {results.map((server) => (
                        <article key={server.id} className="explore-card">
                            <div className="explore-card-banner" style={{ background: server.color }}>
                                <ServerIcon server={server} size={56} />
                            </div>
                            <div className="explore-card-body">
                                <h3>{server.name}</h3>
                                <p>{server.description ?? "Pas encore de description."}</p>
                                <div className="explore-card-footer">
                                    <span className="explore-members">
                                        <i className="dot" /> {server.memberCount} membre{server.memberCount > 1 ? "s" : ""}
                                    </span>
                                    <button
                                        className={server.joined ? "button-secondary" : "button-primary"}
                                        onClick={() => open(server)}
                                    >
                                        {server.joined ? "Ouvrir" : "Rejoindre"}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
