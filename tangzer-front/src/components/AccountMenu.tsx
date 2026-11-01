import { Check, ChevronDown, LogOut, Settings, X } from "lucide-react";
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

/** Menu du compte (en haut à droite) : statut, statut personnalisé, paramètres, déconnexion. */
export default function AccountMenu() {
    const { user, logout, updateUser } = useAuth();
    const { statusOf } = usePresence();
    const { pushToast } = useToasts();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [customStatus, setCustomStatus] = useState(user?.customStatus ?? "");
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    useDismiss(open, () => setOpen(false), menuRef, triggerRef);

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

    const close = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    const onCustomSubmit = (e: FormEvent) => {
        e.preventDefault();
        void save(user.status, customStatus.trim() || null);
        close();
    };

    return (
        <div className="account-menu">
            <button
                ref={triggerRef}
                className="account-button"
                onClick={() => {
                    setCustomStatus(user.customStatus ?? "");
                    setOpen((v) => !v);
                }}
                aria-expanded={open}
                aria-controls={menuId}
            >
                <Avatar user={user} size={32} status={statusOf(user.id)} />
                <span className="account-names">
                    <strong>{user.displayName}</strong>
                    <span>{user.customStatus || STATUS_LABELS[user.status]}</span>
                </span>
                <ChevronDown className={open ? "account-chevron open" : "account-chevron"} size={18} />
                <span className="sr-only">: mon compte</span>
            </button>

            {open && (
                <div className="dropdown account-dropdown" id={menuId} ref={menuRef}>
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
                                    close();
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

                    <div className="dropdown-separator" />
                    <button
                        className="dropdown-item"
                        onClick={() => {
                            setOpen(false);
                            setSettingsOpen(true);
                        }}
                    >
                        <Settings size={18} /> Paramètres
                    </button>
                    <button
                        className="dropdown-item danger"
                        onClick={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    >
                        <LogOut size={18} /> Se déconnecter
                    </button>
                </div>
            )}

            {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
        </div>
    );
}
