import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createServer } from "../../api/servers";
import { useServers } from "../../context/servers";
import { SERVER_COLORS, SERVER_ICONS } from "../../lib/choices";
import { parseInviteCode } from "../../lib/invites";
import Modal from "../Modal";
import ServerIcon from "../ServerIcon";

type Tab = "create" | "join";

/** Créer un serveur, ou en rejoindre un avec un lien d'invitation. */
export default function CreateServerModal({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate();
    const { dispatch } = useServers();

    const [tab, setTab] = useState<Tab>("create");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState<string | null>("🎮");
    const [color, setColor] = useState(SERVER_COLORS[0]);
    const [isPublic, setIsPublic] = useState(false);
    const [inviteInput, setInviteInput] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const server = await createServer({ name, description, icon: icon ?? "", color, isPublic });
            dispatch({ type: "serverUpserted", server });
            onClose();
            navigate(`/app/servers/${server.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Création impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = (e: FormEvent) => {
        e.preventDefault();
        const code = parseInviteCode(inviteInput);
        if (!code) {
            setError("Colle un lien d'invitation ou un code valide.");
            return;
        }
        onClose();
        navigate(`/invite/${code}`);
    };

    const switchTab = (next: Tab) => {
        setTab(next);
        setError("");
    };

    return (
        <Modal
            title={tab === "create" ? "Crée ton serveur" : "Rejoindre un serveur"}
            subtitle={tab === "create"
                ? "Ton serveur, c'est là où tu retrouves tes potes. Donne-lui une personnalité !"
                : "Saisis une invitation pour rejoindre un serveur existant."}
            onClose={onClose}
        >
            <div className="tabs">
                <button className={tab === "create" ? "tab active" : "tab"} onClick={() => switchTab("create")}>Créer</button>
                <button className={tab === "join" ? "tab active" : "tab"} onClick={() => switchTab("join")}>Rejoindre</button>
            </div>

            {tab === "create" ? (
                <form className="form" onSubmit={handleCreate}>
                    <div className="server-preview">
                        <ServerIcon server={{ name: name || "Nouveau serveur", icon, color }} size={72} />
                        <span>{name || "Nouveau serveur"}</span>
                    </div>

                    <label htmlFor="server-name">Nom du serveur</label>
                    <input
                        id="server-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={50}
                        placeholder="Le serveur de la team"
                        autoFocus
                    />

                    <label>Icône</label>
                    <div className="emoji-grid">
                        <button
                            type="button"
                            className={icon === null ? "emoji-choice active" : "emoji-choice"}
                            onClick={() => setIcon(null)}
                            title="Initiales"
                        >
                            Aa
                        </button>
                        {SERVER_ICONS.map((emoji) => (
                            <button
                                type="button"
                                key={emoji}
                                className={icon === emoji ? "emoji-choice active" : "emoji-choice"}
                                onClick={() => setIcon(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <label>Couleur</label>
                    <div className="color-grid">
                        {SERVER_COLORS.map((c) => (
                            <button
                                type="button"
                                key={c}
                                className={color === c ? "color-choice active" : "color-choice"}
                                style={{ background: c }}
                                onClick={() => setColor(c)}
                                aria-label={`Couleur ${c}`}
                            />
                        ))}
                    </div>

                    <label htmlFor="server-description">Description (facultatif)</label>
                    <textarea
                        id="server-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={300}
                        rows={2}
                        placeholder="De quoi parle-t-on ici ?"
                    />

                    <label className="switch">
                        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                        <span>
                            <strong>Serveur public</strong>
                            <small>Visible dans « Explorer » : tout le monde peut le rejoindre sans invitation.</small>
                        </span>
                    </label>

                    {error && <p className="form-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" className="button-link" onClick={onClose}>Annuler</button>
                        <button type="submit" className="button-primary" disabled={submitting || name.trim().length < 2}>
                            {submitting ? "Création…" : "Créer"}
                        </button>
                    </div>
                </form>
            ) : (
                <form className="form" onSubmit={handleJoin}>
                    <label htmlFor="invite-input">Lien d'invitation</label>
                    <input
                        id="invite-input"
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        placeholder={`${window.location.origin}/invite/aB3dE5fG`}
                        autoFocus
                    />
                    <p className="form-hint">Les invitations ressemblent à aB3dE5fG ou {window.location.origin}/invite/aB3dE5fG</p>

                    {error && <p className="form-error">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" className="button-link" onClick={onClose}>Annuler</button>
                        <button type="submit" className="button-primary">Rejoindre</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
