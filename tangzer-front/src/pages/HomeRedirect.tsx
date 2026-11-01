import { Navigate } from "react-router-dom";

import { useServers } from "../context/servers";
import { getLastServer } from "../lib/lastVisited";

/** /app : on rouvre le dernier serveur visité, sinon le serveur public, sinon Explorer. */
export default function HomeRedirect() {
    const { servers, loaded } = useServers();

    if (!loaded) {
        return <div className="page-loading">Chargement de tes serveurs…</div>;
    }

    const lastServer = getLastServer();
    const target = servers.find((s) => s.id === lastServer)
        ?? servers.find((s) => s.isDefault)
        ?? servers[0];

    return <Navigate to={target ? `/app/servers/${target.id}` : "/app/explore"} replace />;
}
