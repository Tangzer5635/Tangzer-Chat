import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import Alert from "../components/ui/Alert";
import Field from "../components/ui/Field";
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

            <form className="form" onSubmit={handleSubmit} noValidate>
                <Field id="register-username" label="Nom d'utilisateur" hint="De 3 à 20 caractères : lettres, chiffres, point ou tiret bas. Il sert à te connecter.">
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

                <Field id="register-display-name" label="Nom affiché (facultatif)" hint="Le nom que les autres verront.">
                    {(control) => (
                        <input
                            {...control}
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={32}
                        />
                    )}
                </Field>

                <Field id="register-password" label="Mot de passe" hint="6 caractères minimum.">
                    {(control) => (
                        <input
                            {...control}
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    )}
                </Field>

                <Field id="register-confirmation" label="Confirmer le mot de passe">
                    {(control) => (
                        <input
                            {...control}
                            type="password"
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            required
                        />
                    )}
                </Field>

                {error && <Alert tone="error">{error}</Alert>}

                <button type="submit" className="button-primary big login-submit" disabled={submitting}>
                    {submitting ? "Création…" : "Créer mon compte"}
                </button>
            </form>

            <p className="login-switch">
                Déjà un compte ? <Link to="/login" state={location.state}>Se connecter</Link>
            </p>
        </AuthLayout>
    );
}
