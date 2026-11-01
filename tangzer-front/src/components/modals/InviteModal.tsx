import { useEffect, useState } from "react";

import { createInvite } from "../../api/servers";
import { INVITE_DURATIONS, INVITE_MAX_USES } from "../../lib/choices";
import { describeExpiry, inviteUrl } from "../../lib/invites";
import type { Invite, Server } from "../../types/api";
import { Check, Copy } from "lucide-react";

import Modal from "../Modal";
import Alert from "../ui/Alert";

/** Génère un lien d'invitation à partager (7 jours, illimité par défaut). */
export default function InviteModal({ server, onClose }: { server: Server; onClose: () => void }) {
    const [hours, setHours] = useState<number | null>(24 * 7);
    const [maxUses, setMaxUses] = useState<number | null>(null);
    const [invite, setInvite] = useState<Invite | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    // Un nouveau lien à chaque changement d'options.
    useEffect(() => {
        let cancelled = false;
        createInvite(server.id, hours, maxUses)
            .then((created) => {
                if (!cancelled) {
                    setInvite(created);
                    setCopied(false);
                }
            })
            .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Erreur"));
        return () => {
            cancelled = true;
        };
    }, [server.id, hours, maxUses]);

    const link = invite ? inviteUrl(invite.code) : "";

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
        } catch {
            // Presse-papiers indisponible (HTTP sur le réseau local) : on sélectionne le texte.
            (document.getElementById("invite-link") as HTMLInputElement | null)?.select();
        }
        setCopied(true);
    };

    return (
        <Modal title={`Inviter des personnes sur ${server.name}`} onClose={onClose}>
            <div className="form">
                <label htmlFor="invite-link">Lien d'invitation à partager</label>
                <div className="copy-field">
                    <input id="invite-link" value={link} readOnly onFocus={(e) => e.target.select()} aria-describedby="invite-validity" />
                    <button className={copied ? "button-success" : "button-primary"} onClick={copy} disabled={!invite}>
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "Copié" : "Copier"}
                    </button>
                </div>
                {invite && (
                    <p className="form-hint" id="invite-validity" aria-live="polite">
                        Ce lien {describeExpiry(invite.expiresAt)}
                        {invite.maxUses ? ` et servira ${invite.maxUses} fois au maximum.` : "."}
                    </p>
                )}
                {error && <Alert tone="error">{error}</Alert>}

                <div className="form-row">
                    <div>
                        <label htmlFor="invite-duration">Expire après</label>
                        <select
                            id="invite-duration"
                            value={hours ?? ""}
                            onChange={(e) => setHours(e.target.value ? Number(e.target.value) : null)}
                        >
                            {INVITE_DURATIONS.map((d) => (
                                <option key={d.label} value={d.hours ?? ""}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="invite-uses">Nombre d'utilisations</label>
                        <select
                            id="invite-uses"
                            value={maxUses ?? ""}
                            onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
                        >
                            {INVITE_MAX_USES.map((u) => (
                                <option key={u.label} value={u.uses ?? ""}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
