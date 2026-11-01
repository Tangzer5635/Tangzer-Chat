import { Check, LogOut, Settings, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { updateMyStatus } from "../api/presence";
import { useAuth } from "../context/auth";
import { usePresence } from "../context/presence";
import { useToasts } from "../context/toasts";
import { SELECTABLE_STATUSES, STATUS_LABELS } from "../lib/presence";
import type { UserStatus } from "../types/api";
import Avatar from "./Avatar";
import SettingsModal from "./settings/SettingsModal";
import { useDismiss } from "./ui/useDismiss";

/** Bas de la barre latérale : mon statut (cliquer pour le changer), paramètres et déconnexion. */
export default function UserPanel() {
    const { user, logout, updateUser } = useAuth();
    const { statusOf } = usePresence();
    const { pushToast } = useToasts();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [customStatus, setCustomStatus] = useState(user?.customStatus ?? "");
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    useDismiss(menuOpen, () => setMenuOpen(false), menuRef, triggerRef);

    if (!user) {
        return null;
    }

    const save = async (status: UserStatus, custom: string | null) => {
        try {
            updateUser(await updateMyStatus(status, custom));
        } catch (err) {
            pushToast(err instanceof Error ? err.message : "Statut non enregistré.", { tone: "error" });
        }
    };

    const closeMenu = () => {
        setMenuOpen(false);
        triggerRef.current?.focus();
    };

    const onCustomSubmit = (e: FormEvent) => {
        e.preventDefault();
        void save(user.status, customStatus.trim() || null);
        closeMenu();
    };

    return (
        <div className="user-panel">
            <button
                ref={triggerRef}
                className="user-panel-me"
                onClick={() => {
                    setCustomStatus(user.customStatus ?? "");
                    setMenuOpen((open) => !open);
                }}
                aria-expanded={menuOpen}
                aria-controls={menuId}
            >
                <Avatar user={user} size={32} status={statusOf(user.id)} />
                <span className="user-panel-names">
                    <strong>{user.displayName}</strong>
                    <span>{user.customStatus || STATUS_LABELS[user.status]}</span>
                </span>
                <span className="sr-only">: changer de statut</span>
            </button>
            <button
                className="icon-button"
                title="Paramètres"
                aria-label="Paramètres"
                onClick={() => setSettingsOpen(true)}
            >
                <Settings size={20} />
            </button>
            <button
                className="icon-button"
                title="Se déconnecter"
                aria-label="Se déconnecter"
                onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                }}
            >
                <LogOut size={20} />
            </button>
            {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

            {menuOpen && (
                <div className="status-menu" id={menuId} ref={menuRef}>
                    <form className="status-custom" onSubmit={onCustomSubmit}>
                        <label htmlFor={`${menuId}-perso`}>Statut personnalisé</label>
                        <div className="status-custom-row">
                            <input
                                id={`${menuId}-perso`}
                                className="input"
                                value={customStatus}
                                onChange={(e) => setCustomStatus(e.target.value)}
                                placeholder="En réunion jusqu'à 15 h"
                                maxLength={80}
                                autoFocus
                            />
                            {user.customStatus && (
                                <button
                                    type="button"
                                    className="icon-button"
                                    aria-label="Effacer le statut personnalisé"
                                    title="Effacer le statut personnalisé"
                                    onClick={() => {
                                        setCustomStatus("");
                                        void save(user.status, null);
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </form>
                    <div className="dropdown-separator" />
                    <p className="status-menu-title" id={`${menuId}-titre`}>Disponibilité</p>
                    <div role="group" aria-labelledby={`${menuId}-titre`}>
                        {SELECTABLE_STATUSES.map(({ status, description }) => (
                            <button
                                key={status}
                                className="status-option"
                                aria-pressed={user.status === status}
                                onClick={() => {
                                    void save(status, user.customStatus);
                                    closeMenu();
                                }}
                            >
                                <span className={`status-dot inline status-${status.toLowerCase()}`} aria-hidden="true" />
                                <span>
                                    <strong>{STATUS_LABELS[status]}</strong>
                                    {description && <small>{description}</small>}
                                </span>
                                {user.status === status && <Check className="status-option-check" size={18} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
