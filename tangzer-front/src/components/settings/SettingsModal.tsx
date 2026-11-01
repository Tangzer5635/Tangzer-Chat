import { Bell, Lock, Mic, Palette, User, X, type LucideIcon } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { changePassword } from "../../api/users";
import { useAuth } from "../../context/auth";
import { useToasts } from "../../context/toasts";
import AppearanceSettings from "./AppearanceSettings";
import { NotificationSettings, VoiceSettings } from "./DeviceSettings";
import ProfileSettings from "./ProfileSettings";
import Alert from "../ui/Alert";
import Tabs from "../ui/Tabs";
import { useModalDialog } from "../ui/useModalDialog";

type Tab = "profile" | "appearance" | "notifications" | "voice" | "account";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "profile", label: "Mon profil", icon: User },
    { id: "appearance", label: "Apparence", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "voice", label: "Voix et vidéo", icon: Mic },
    { id: "account", label: "Mon compte", icon: Lock },
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
            <label htmlFor="account-username">Nom d'utilisateur</label>
            <input id="account-username" value={`@${user?.username ?? ""}`} readOnly aria-describedby="account-username-hint" />
            <p className="form-hint" id="account-username-hint">Le nom d'utilisateur sert à se connecter et ne change pas. Le nom affiché se modifie dans « Mon profil ».</p>

            <form className="form" onSubmit={submit}>
                <label htmlFor="current-password">Mot de passe actuel</label>
                <input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                <label htmlFor="new-password">Nouveau mot de passe</label>
                <input id="new-password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
                <label htmlFor="confirm-password">Confirmer le nouveau mot de passe</label>
                <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
                {error && <Alert tone="error">{error}</Alert>}
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

/** Paramètres en plein écran : onglets à gauche, contenu à droite. Échap pour fermer. */
export default function SettingsModal({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<Tab>("profile");
    const ref = useModalDialog();

    const panes: Record<Tab, ReactNode> = {
        profile: <ProfileSettings />,
        appearance: <AppearanceSettings />,
        notifications: <NotificationSettings />,
        voice: <VoiceSettings />,
        account: <AccountSettings onClose={onClose} />,
    };

    return (
        <dialog
            ref={ref}
            className="settings"
            aria-label="Paramètres"
            tabIndex={-1}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <Tabs
                label="Paramètres"
                orientation="vertical"
                tabs={TABS.map(({ id, label, icon: Icon }) => ({ id, label: <><Icon size={18} />{label}</> }))}
                value={tab}
                onChange={setTab}
                className="settings-tabs"
            >
                <div className="settings-content">
                    <h2>{TABS.find((item) => item.id === tab)?.label}</h2>
                    {panes[tab]}
                </div>
            </Tabs>
            <button type="button" className="icon-button settings-close" onClick={onClose} aria-label="Fermer les paramètres">
                <X size={22} />
            </button>
        </dialog>
    );
}
