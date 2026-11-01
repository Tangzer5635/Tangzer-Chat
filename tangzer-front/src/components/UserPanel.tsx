import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { updateMyStatus } from "../api/presence";
import { useAuth } from "../context/auth";
import { usePresence } from "../context/presence";
import { useToasts } from "../context/toasts";
import { SELECTABLE_STATUSES, STATUS_LABELS } from "../lib/presence";
import type { UserStatus } from "../types/api";
import Avatar from "./Avatar";

/** Bas de la barre latérale : mon statut (cliquer pour le changer) et déconnexion. */
export default function UserPanel() {
    const { user, logout, updateUser } = useAuth();
    const { statusOf } = usePresence();
    const { pushToast } = useToasts();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [customStatus, setCustomStatus] = useState(user?.customStatus ?? "");
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) {
            return;
        }
        const onClick = (e: MouseEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [menuOpen]);

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

    const onCustomSubmit = (e: FormEvent) => {
        e.preventDefault();
        void save(user.status, customStatus.trim() || null);
        setMenuOpen(false);
    };

    return (
        <div className="user-panel" ref={panelRef}>
            <button
                className="user-panel-me"
                onClick={() => {
                    setCustomStatus(user.customStatus ?? "");
                    setMenuOpen((open) => !open);
                }}
                title="Changer de statut"
            >
                <Avatar user={user} size={32} status={statusOf(user.id)} />
                <span className="user-panel-names">
                    <strong>{user.displayName}</strong>
                    <span>{user.customStatus || STATUS_LABELS[user.status]}</span>
                </span>
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
                ⏻
            </button>

            {menuOpen && (
                <div className="status-menu" role="menu">
                    <form className="status-custom" onSubmit={onCustomSubmit}>
                        <input
                            value={customStatus}
                            onChange={(e) => setCustomStatus(e.target.value)}
                            placeholder="😎 Statut personnalisé…"
                            maxLength={80}
                            autoFocus
                        />
                        {user.customStatus && (
                            <button
                                type="button"
                                className="icon-button small"
                                title="Effacer le statut"
                                onClick={() => {
                                    setCustomStatus("");
                                    void save(user.status, null);
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </form>
                    <div className="dropdown-separator" />
                    {SELECTABLE_STATUSES.map(({ status, description }) => (
                        <button
                            key={status}
                            className={user.status === status ? "status-option active" : "status-option"}
                            onClick={() => {
                                void save(status, user.customStatus);
                                setMenuOpen(false);
                            }}
                        >
                            <span className={`status-dot inline status-${status.toLowerCase()}`} />
                            <span>
                                <strong>{STATUS_LABELS[status]}</strong>
                                {description && <small>{description}</small>}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
