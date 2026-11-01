import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";
import AuthLayout from "../layout/AuthLayout";
import { APP_NAME } from "../lib/brand";

export default function Register() {
    const { user, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/app";

    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmation) {
            setError("Les deux mots de passe ne correspondent pas.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            await register(username.trim(), displayName.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Inscription impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <h2>Créer un compte</h2>
            <p className="login-subtitle">Rejoins la communauté {APP_NAME}.</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="register-username">Nom d'utilisateur</label>
                <input
                    id="register-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="3 à 20 caractères : lettres, chiffres, . ou _"
                    autoFocus
                />

                <label htmlFor="register-display-name">Nom affiché</label>
                <input
                    id="register-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Comment les autres te verront (facultatif)"
                    maxLength={32}
                />

                <label htmlFor="register-password">Mot de passe</label>
                <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                />

                <label htmlFor="register-confirmation">Confirmer le mot de passe</label>
                <input
                    id="register-confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                />

                {error && <p className="login-error">{error}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? "Création…" : "Continuer"}
                </button>
            </form>

            <p className="login-switch">
                Déjà un compte ? <Link to="/login" state={location.state}>Se connecter</Link>
            </p>
        </AuthLayout>
    );
}
