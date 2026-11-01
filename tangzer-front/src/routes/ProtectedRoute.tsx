import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/auth";
import { DmProvider } from "../context/DmContext";
import { ServersProvider } from "../context/ServersContext";
import { UnreadProvider } from "../context/UnreadContext";

/**
 * Pages réservées aux utilisateurs connectés.
 * Les données de l'utilisateur (serveurs, MP) repartent de zéro à chaque connexion.
 */
export default function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="splash">Connexion à Tangzer…</div>;
    }

    if (!user) {
        // On mémorise la page demandée pour y revenir après la connexion.
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }

    return (
        <ServersProvider key={user.id}>
            <UnreadProvider>
                <DmProvider>
                    <Outlet />
                </DmProvider>
            </UnreadProvider>
        </ServersProvider>
    );
}
