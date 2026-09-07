import { useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";

import { login } from "../services/auth";
import { connectWebSocket } from "../services/websocket";
import { useChatContext } from "../context/ChatContext";

export default function Login() {

    const navigate = useNavigate();

    const {
        setCurrentUser,
        addPublicMessage,
        addPrivateMessage,
        pushNotification,
        updateMessageStatus,
        updateTypingStatus,
    } = useChatContext();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: FormEvent) => {

        e.preventDefault();

        const name = username.trim();

        if (!name || !password) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        try {

            setError("");

            await login(name, password);

            setCurrentUser(name);

            connectWebSocket(
                addPublicMessage,
                addPrivateMessage,
                pushNotification,
                updateMessageStatus,
                updateTypingStatus
            );

            navigate("/app/chat");

        } catch (err) {
            console.error("Erreur login :", err);
            setError("Identifiant ou mot de passe incorrect.");
        }
    };

    return (
        <div className="login-page">

            <div className="login-brand">
                <img
                    src="/favicon.jpg"
                    alt="Tangzer"
                    className="login-logo"
                />

                <h1>Tangzer</h1>

                <p>
                    Messagerie instantanée
                    <br />
                    sécurisée par JWT.
                </p>
            </div>

            <div className="login-form-side">

                <div className="login-box">

                    <h2>Connexion</h2>

                    <form onSubmit={handleLogin}>

                        <label>Nom d'utilisateur</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="admin"
                        />

                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="••••••••"
                        />

                        {error && (
                            <p className="login-error">
                                {error}
                            </p>
                        )}

                        <button type="submit">
                            Se connecter
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}