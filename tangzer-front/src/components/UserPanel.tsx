import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";
import Avatar from "./Avatar";

/** Bas de la barre latérale : qui suis-je, et déconnexion. */
export default function UserPanel() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return null;
    }

    return (
        <div className="user-panel">
            <Avatar user={user} size={32} />
            <div className="user-panel-names">
                <strong>{user.displayName}</strong>
                <span>@{user.username}</span>
            </div>
            <button
                className="icon-button"
                title="Se déconnecter"
                aria-label="Se déconnecter"
                onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                }}
            >
                ⏻
            </button>
        </div>
    );
}
