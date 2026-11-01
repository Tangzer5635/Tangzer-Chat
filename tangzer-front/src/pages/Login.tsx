import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";
import AuthLayout from "../layout/AuthLayout";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/app";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            await login(username.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Connexion impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <h2>Ha, te revoilà !</h2>
            <p className="login-subtitle">Nous sommes si heureux de te revoir !</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="login-username">Nom d'utilisateur</label>
                <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                />

                <label htmlFor="login-password">Mot de passe</label>
                <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="login-error">{error}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? "Connexion…" : "Se connecter"}
                </button>
            </form>

            <p className="login-switch">
                Besoin d'un compte ? <Link to="/register" state={location.state}>S'inscrire</Link>
            </p>
        </AuthLayout>
    );
}
