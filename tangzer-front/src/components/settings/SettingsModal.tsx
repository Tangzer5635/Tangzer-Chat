import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { changePassword } from "../../api/users";
import { useAuth } from "../../context/auth";
import { useToasts } from "../../context/toasts";
import AppearanceSettings from "./AppearanceSettings";
import { NotificationSettings, VoiceSettings } from "./DeviceSettings";
import ProfileSettings from "./ProfileSettings";

type Tab = "profile" | "appearance" | "notifications" | "voice" | "account";

const TABS: { id: Tab; label: string; title: string }[] = [
    { id: "profile", label: "👤 Mon profil", title: "Mon profil" },
    { id: "appearance", label: "🎨 Apparence", title: "Apparence" },
    { id: "notifications", label: "🔔 Notifications", title: "Notifications" },
    { id: "voice", label: "🎙️ Voix et vidéo", title: "Voix et vidéo" },
    { id: "account", label: "🔐 Mon compte", title: "Mon compte" },
];

/** Mon compte : nom d'utilisateur, mot de passe, déconnexion. */
function AccountSettings({ onClose }: { onClose: () => void }) {
    const { user, logout } = useAuth();
    const { pushToast } = useToasts();
    const navigate = useNavigate();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (next !== confirmation) {
            setError("Les deux nouveaux mots de passe ne correspondent pas.");
            return;
        }
        try {
            await changePassword(current, next);
            setCurrent("");
            setNext("");
            setConfirmation("");
            setError("");
            pushToast("Mot de passe modifié.", { tone: "success" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Modification impossible.");
        }
    };

    return (
        <div className="form">
            <label>Nom d'utilisateur</label>
            <input value={`@${user?.username ?? ""}`} readOnly />
            <p className="form-hint">Le nom d'utilisateur sert à se connecter et ne change pas. Le nom affiché se modifie dans « Mon profil ».</p>

            <form className="form" onSubmit={submit}>
                <label htmlFor="current-password">Mot de passe actuel</label>
                <input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                <label htmlFor="new-password">Nouveau mot de passe</label>
                <input id="new-password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
                <label htmlFor="confirm-password">Confirmer le nouveau mot de passe</label>
                <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
                {error && <p className="form-error">{error}</p>}
                <div className="settings-actions">
                    <button type="submit" className="button-primary" disabled={!current || !next}>Changer le mot de passe</button>
                </div>
            </form>

            <div className="settings-danger">
                <button
                    className="button-danger"
                    onClick={() => {
                        onClose();
                        logout();
                        navigate("/login", { replace: true });
                    }}
                >
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}

/** Paramètres plein écran, façon Discord. Échap pour fermer. */
export default function SettingsModal({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<Tab>("profile");

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const panes: Record<Tab, ReactNode> = {
        profile: <ProfileSettings />,
        appearance: <AppearanceSettings />,
        notifications: <NotificationSettings />,
        voice: <VoiceSettings />,
        account: <AccountSettings onClose={onClose} />,
    };

    return (
        <div className="settings" role="dialog" aria-modal="true" aria-label="Paramètres">
            <nav className="settings-nav">
                <h3>Paramètres</h3>
                {TABS.map((item) => (
                    <button
                        key={item.id}
                        className={tab === item.id ? "settings-tab active" : "settings-tab"}
                        onClick={() => setTab(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
            <main className="settings-content">
                <h2>{TABS.find((item) => item.id === tab)?.title}</h2>
                {panes[tab]}
            </main>
            <button className="settings-close" onClick={onClose} aria-label="Fermer les paramètres">
                ✕<span>ÉCHAP</span>
            </button>
        </div>
    );
}
