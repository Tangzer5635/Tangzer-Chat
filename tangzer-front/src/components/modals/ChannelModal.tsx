import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createChannel, deleteChannel, updateChannel } from "../../api/servers";
import { useServers } from "../../context/servers";
import type { Channel } from "../../types/api";
import { Hash, Volume2 } from "lucide-react";

import Modal from "../Modal";
import Alert from "../ui/Alert";

interface ChannelModalProps {
    serverId: number;
    /** Salon à modifier ; absent = création. */
    channel?: Channel;
    onClose: () => void;
}

/** Créer un salon, ou renommer / changer le sujet / supprimer un salon existant. */
export default function ChannelModal({ serverId, channel, onClose }: ChannelModalProps) {
    const navigate = useNavigate();
    const { dispatch, getServer } = useServers();

    const [name, setName] = useState(channel?.name ?? "");
    const [topic, setTopic] = useState(channel?.topic ?? "");
    const [type, setType] = useState<"TEXT" | "VOICE">("TEXT");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Aperçu du nom tel que le serveur l'enregistrera (« Mon Salon » → « mon-salon »).
    const preview = name.trim().toLowerCase().replace(/\s+/g, "-");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const saved = channel
                ? await updateChannel(channel.id, { name, topic })
                : await createChannel(serverId, { name, topic, type });
            dispatch({ type: "channelUpserted", channel: saved });
            onClose();
            navigate(`/app/servers/${serverId}/channels/${saved.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!channel || !window.confirm(`Supprimer le salon #${channel.name} ?`)) {
            return;
        }
        try {
            await deleteChannel(channel.id);
            dispatch({ type: "channelRemoved", serverId, channelId: channel.id });
            onClose();
            const remaining = getServer(serverId)?.channels.filter((c) => c.id !== channel.id) ?? [];
            navigate(remaining[0] ? `/app/servers/${serverId}/channels/${remaining[0].id}` : `/app/servers/${serverId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Suppression impossible.");
        }
    };

    return (
        <Modal
            title={channel ? `Modifier #${channel.name}` : "Créer un salon"}
            subtitle={channel ? undefined : "dans le serveur " + (getServer(serverId)?.name ?? "")}
            onClose={onClose}
        >
            <form className="form" onSubmit={handleSubmit}>
                {!channel && (
                    <fieldset className="choice-group">
                        <legend className="form-label">Type de salon</legend>
                        <div className="channel-types">
                            <button type="button" className="channel-type" aria-pressed={type === "TEXT"} onClick={() => setType("TEXT")}>
                                <Hash size={22} />
                                <strong>Textuel</strong>
                                <small>Messages, images, réactions…</small>
                            </button>
                            <button type="button" className="channel-type" aria-pressed={type === "VOICE"} onClick={() => setType("VOICE")}>
                                <Volume2 size={22} />
                                <strong>Vocal</strong>
                                <small>Discuter de vive voix</small>
                            </button>
                        </div>
                    </fieldset>
                )}
                <label htmlFor="channel-name">Nom du salon</label>
                <div className="input-prefixed">
                    <span aria-hidden="true">#</span>
                    <input
                        id="channel-name"
                        aria-describedby={preview && preview !== name ? "channel-name-preview" : undefined}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={32}
                        placeholder="nouveau-salon"
                        autoFocus
                    />
                </div>
                {preview && preview !== name && <p className="form-hint" id="channel-name-preview">Sera enregistré sous #{preview}</p>}

                <label htmlFor="channel-topic">Sujet (facultatif)</label>
                <input
                    id="channel-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={200}
                    placeholder="De quoi parle ce salon ?"
                />

                {error && <Alert tone="error">{error}</Alert>}

                <div className="modal-actions">
                    {channel && (
                        <button type="button" className="button-danger" onClick={handleDelete}>Supprimer</button>
                    )}
                    <span className="spacer" />
                    <button type="button" className="button-link" onClick={onClose}>Annuler</button>
                    <button type="submit" className="button-primary" disabled={saving || !name.trim()}>
                        {channel ? "Enregistrer" : "Créer le salon"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
