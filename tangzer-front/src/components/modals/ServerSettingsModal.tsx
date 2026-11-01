import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { uploadAttachment } from "../../api/attachments";
import { deleteServer, updateServer } from "../../api/servers";
import { useServers } from "../../context/servers";
import { useToasts } from "../../context/toasts";
import { validateImageFile } from "../../lib/attachments";
import { cropToSquare } from "../../lib/image";
import type { Server } from "../../types/api";
import Modal from "../Modal";
import ServerIcon from "../ServerIcon";
import Alert from "../ui/Alert";
import Field from "../ui/Field";
import ServerLookPicker from "./ServerLookPicker";

/** Paramètres du serveur (propriétaire et admins). */
export default function ServerSettingsModal({ server, onClose }: { server: Server; onClose: () => void }) {
    const navigate = useNavigate();
    const { dispatch } = useServers();
    const { pushToast } = useToasts();

    const [name, setName] = useState(server.name);
    const [description, setDescription] = useState(server.description ?? "");
    const [icon, setIcon] = useState<string | null>(server.icon);
    const [color, setColor] = useState(server.color);
    const [isPublic, setIsPublic] = useState(server.isPublic);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [iconUrl, setIconUrl] = useState(server.iconUrl);
    const imageInput = useRef<HTMLInputElement>(null);

    const changeImage = async (file: File | undefined) => {
        if (!file) {
            return;
        }
        const invalid = validateImageFile(file);
        if (invalid) {
            setError(invalid);
            return;
        }
        try {
            const attachment = await uploadAttachment(await cropToSquare(file), () => undefined);
            const updated = await updateServer(server.id, { iconImageId: attachment.id });
            dispatch({ type: "serverUpserted", server: updated });
            setIconUrl(updated.iconUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Envoi impossible.");
        }
    };

    const removeImage = async () => {
        const updated = await updateServer(server.id, { iconImageId: "" });
        dispatch({ type: "serverUpserted", server: updated });
        setIconUrl(null);
    };

    const canDelete = server.myRole === "OWNER" && !server.isDefault;

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const updated = await updateServer(server.id, { name, description, icon: icon ?? "", color, isPublic });
            dispatch({ type: "serverUpserted", server: updated });
            pushToast("Paramètres enregistrés.", { tone: "success" });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Supprimer définitivement « ${server.name} » ? Tous ses salons disparaîtront.`)) {
            return;
        }
        try {
            await deleteServer(server.id);
            dispatch({ type: "serverRemoved", serverId: server.id });
            onClose();
            navigate("/app");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Suppression impossible.");
        }
    };

    return (
        <Modal title="Paramètres du serveur" onClose={onClose}>
            <form className="form" onSubmit={handleSave}>
                <div className="server-preview">
                    <ServerIcon server={{ name: name || server.name, icon, iconUrl, color }} size={64} />
                    <span aria-hidden="true">{name || server.name}</span>
                    <div className="settings-row">
                        <button type="button" className="button-secondary" onClick={() => imageInput.current?.click()}>
                            {iconUrl ? "Changer l'image" : "Utiliser une image"}
                        </button>
                        {iconUrl && <button type="button" className="button-link" onClick={removeImage}>Retirer l'image</button>}
                    </div>
                    <input
                        ref={imageInput}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        hidden
                        onChange={(e) => {
                            void changeImage(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                </div>

                <Field label="Nom du serveur" hint="De 2 à 50 caractères.">
                    {(control) => <input {...control} value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />}
                </Field>

                <ServerLookPicker icon={icon} onIconChange={setIcon} color={color} onColorChange={setColor} />

                <Field label="Description">
                    {(control) => (
                        <textarea {...control} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={2} />
                    )}
                </Field>

                <label className="switch">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                    <span>
                        <strong>Serveur public</strong>
                        <small>Visible dans « Explorer » et rejoignable sans invitation.</small>
                    </span>
                </label>

                {error && <Alert tone="error">{error}</Alert>}

                <div className="modal-actions">
                    {canDelete && (
                        <button type="button" className="button-danger" onClick={handleDelete}>
                            Supprimer le serveur
                        </button>
                    )}
                    <span className="spacer" />
                    <button type="button" className="button-link" onClick={onClose}>Annuler</button>
                    <button type="submit" className="button-primary" disabled={saving}>
                        {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
