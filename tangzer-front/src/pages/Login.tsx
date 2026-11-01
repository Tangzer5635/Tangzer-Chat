import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/auth";
import Alert from "../components/ui/Alert";
import Field from "../components/ui/Field";
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
            setError("Saisis ton nom d'utilisateur et ton mot de passe.");
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
            <h2>Connexion</h2>
            <p className="login-subtitle">Content de te revoir.</p>

            <form className="form" onSubmit={handleSubmit} noValidate>
                <Field id="login-username" label="Nom d'utilisateur">
                    {(control) => (
                        <input
                            {...control}
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                            required
                        />
                    )}
                </Field>

                <Field id="login-password" label="Mot de passe">
                    {(control) => (
                        <input
                            {...control}
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    )}
                </Field>

                {error && <Alert tone="error">{error}</Alert>}

                <button type="submit" className="button-primary big login-submit" disabled={submitting}>
                    {submitting ? "Connexion…" : "Se connecter"}
                </button>
            </form>

            <p className="login-switch">
                Pas encore de compte ? <Link to="/register" state={location.state}>Créer un compte</Link>
            </p>
        </AuthLayout>
    );
}
