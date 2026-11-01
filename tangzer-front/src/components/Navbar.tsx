import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";
import { useChatContext } from "../context/chatContext";

export default function Navbar() {

    const navigate = useNavigate();
    const { unreadDmCount } = useChatContext();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <nav className="navbar">

            <div className="navbar-logo">
                <img src="/favicon.jpg" alt="Tangzer" className="brand-logo"/>
                <span>Tangzer</span>
            </div>

            <div className="navbar-links">

                <NavLink to="/app/chat" className={({ isActive }) =>
                        isActive
                            ? "navbar-link active"
                            : "navbar-link"
                    }
                >Chat</NavLink>

                <NavLink to="/app/dm" className={({ isActive }) =>
                        isActive
                            ? "navbar-link active"
                            : "navbar-link"
                    }>Messages privés
                    {unreadDmCount > 0 && (
                        <span className="badge">{unreadDmCount}</span>
                    )}
                </NavLink>

                <NavLink to="/app/rooms" className={({ isActive }) =>
                        isActive
                            ? "navbar-link active"
                            : "navbar-link"
                    }
                >Salons</NavLink>

            </div>
            <span className="navbar-user">{user?.displayName}</span>
            <button className="navbar-logout" onClick={handleLogout}>Déconnexion</button>
        </nav>
    );
}