import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createServer } from "../../api/servers";
import { useServers } from "../../context/servers";
import { SERVER_COLORS } from "../../lib/choices";
import { parseInviteCode } from "../../lib/invites";
import Modal from "../Modal";
import ServerIcon from "../ServerIcon";
import Alert from "../ui/Alert";
import Field from "../ui/Field";
import Tabs from "../ui/Tabs";
import ServerLookPicker from "./ServerLookPicker";

type Tab = "create" | "join";

const TABS: { id: Tab; label: string }[] = [
    { id: "create", label: "Créer" },
    { id: "join", label: "Rejoindre" },
];

/** Créer un serveur, ou en rejoindre un avec un lien d'invitation. */
export default function CreateServerModal({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate();
    const { dispatch } = useServers();

    const [tab, setTab] = useState<Tab>("create");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState<string | null>(null);
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
            title={tab === "create" ? "Créer un serveur" : "Rejoindre un serveur"}
            subtitle={tab === "create"
                ? "Un serveur regroupe des salons pour ta communauté."
                : "Saisis une invitation pour rejoindre un serveur existant."}
            onClose={onClose}
        >
            <Tabs label="Créer ou rejoindre" tabs={TABS} value={tab} onChange={switchTab}>
                {tab === "create" ? (
                    <form className="form" onSubmit={handleCreate}>
                        <div className="server-preview" aria-hidden="true">
                            <ServerIcon server={{ name: name || "Nouveau serveur", icon, color }} size={64} />
                            <span>{name || "Nouveau serveur"}</span>
                        </div>

                        <Field label="Nom du serveur" hint="De 2 à 50 caractères.">
                            {(control) => (
                                <input
                                    {...control}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={50}
                                    placeholder="Le serveur de l'équipe"
                                    required
                                />
                            )}
                        </Field>

                        <ServerLookPicker icon={icon} onIconChange={setIcon} color={color} onColorChange={setColor} />

                        <Field label="Description (facultatif)">
                            {(control) => (
                                <textarea
                                    {...control}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={300}
                                    rows={2}
                                    placeholder="De quoi parle-t-on ici ?"
                                />
                            )}
                        </Field>

                        <label className="switch">
                            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                            <span>
                                <strong>Serveur public</strong>
                                <small>Visible dans « Explorer » : tout le monde peut le rejoindre sans invitation.</small>
                            </span>
                        </label>

                        {error && <Alert tone="error">{error}</Alert>}

                        <div className="modal-actions">
                            <button type="button" className="button-link" onClick={onClose}>Annuler</button>
                            <button type="submit" className="button-primary" disabled={submitting || name.trim().length < 2}>
                                {submitting ? "Création…" : "Créer le serveur"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="form" onSubmit={handleJoin}>
                        <Field
                            label="Lien ou code d'invitation"
                            hint={`Par exemple aB3dE5fG ou ${window.location.origin}/invite/aB3dE5fG`}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    value={inviteInput}
                                    onChange={(e) => setInviteInput(e.target.value)}
                                    autoComplete="off"
                                />
                            )}
                        </Field>

                        {error && <Alert tone="error">{error}</Alert>}

                        <div className="modal-actions">
                            <button type="button" className="button-link" onClick={onClose}>Annuler</button>
                            <button type="submit" className="button-primary">Rejoindre</button>
                        </div>
                    </form>
                )}
            </Tabs>
        </Modal>
    );
}
