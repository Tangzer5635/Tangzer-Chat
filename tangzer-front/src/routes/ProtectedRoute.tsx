import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/auth";

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

    return <Outlet />;
}
