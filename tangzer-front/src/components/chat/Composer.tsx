import { CircleAlert, ImagePlus, X } from "lucide-react";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

import { ACCEPTED_IMAGE_TYPES } from "../../lib/attachments";
import type { Message } from "../../types/api";
import type { UploadItem } from "./useUploads";

const TYPING_THROTTLE_MS = 3000;
const MAX_LENGTH = 2000;

interface ComposerProps {
    placeholder: string;
    replyTo: Message | null;
    onCancelReply: () => void;
    onSend: (content: string) => void;
    /** Appelé pendant la frappe (au plus toutes les 3 secondes). */
    onTyping: () => void;
    /** Flèche du haut dans un champ vide : modifier son dernier message. */
    onEditLast: () => void;
    uploads: UploadItem[];
    uploading: boolean;
    onAddFiles: (files: File[]) => void;
    onRemoveUpload: (key: string) => void;
}

/** Zone de saisie : Entrée envoie, Maj+Entrée va à la ligne. */
export default function Composer(props: ComposerProps) {
    const { placeholder, replyTo, onCancelReply, onSend, onTyping, onEditLast, uploads, uploading } = props;
    const [draft, setDraft] = useState("");
    const lastTyping = useRef(0);
    const fileInput = useRef<HTMLInputElement>(null);

    const onChange = (value: string) => {
        setDraft(value);
        const now = Date.now();
        if (value.trim() && now - lastTyping.current > TYPING_THROTTLE_MS) {
            lastTyping.current = now;
            onTyping();
        }
    };

    const send = () => {
        const content = draft.trim();
        const hasImages = uploads.some((u) => u.attachment);
        if ((!content && !hasImages) || uploading) {
            return;
        }
        onSend(content);
        setDraft("");
        lastTyping.current = 0;
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        } else if (e.key === "Escape" && replyTo) {
            onCancelReply();
        } else if (e.key === "ArrowUp" && draft === "" && uploads.length === 0) {
            e.preventDefault();
            onEditLast();
        }
    };

    // Coller une capture d'écran l'ajoute directement au message.
    const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const images = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/"));
        if (images.length > 0) {
            e.preventDefault();
            props.onAddFiles(images);
        }
    };

    return (
        <div className="composer">
            <p id="composer-aide" className="sr-only">
                Entrée pour envoyer, Maj+Entrée pour aller à la ligne, flèche haut pour modifier ton dernier message.
            </p>
            {uploads.length > 0 && (
                <div className="upload-tray">
                    {uploads.map((upload) => (
                        <div key={upload.key} className={upload.error ? "upload-item failed" : "upload-item"} title={upload.error ?? upload.file.name}>
                            <img src={upload.previewUrl} alt={upload.file.name} />
                            {!upload.attachment && !upload.error && (
                                <div className="upload-progress"><span style={{ width: `${upload.progress}%` }} /></div>
                            )}
                            {upload.error && <CircleAlert className="upload-error" size={28} role="img" aria-label={`Échec : ${upload.error}`} />}
                            <button className="upload-remove" onClick={() => props.onRemoveUpload(upload.key)} aria-label={`Retirer ${upload.file.name}`}>
                                <X size={14} />
                            </button>
                            <span className="upload-name">{upload.file.name}</span>
                        </div>
                    ))}
                </div>
            )}
            {replyTo && (
                <div className="composer-reply">
                    <span>Réponse à <strong>{replyTo.author.displayName}</strong></span>
                    <button className="icon-button small" onClick={onCancelReply} aria-label="Annuler la réponse"><X size={16} /></button>
                </div>
            )}
            <div className={replyTo ? "composer-box with-reply" : "composer-box"}>
                <button
                    className="composer-attach"
                    onClick={() => fileInput.current?.click()}
                    title="Ajouter des images"
                    aria-label="Ajouter des images"
                >
                    <ImagePlus size={20} />
                </button>
                <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    multiple
                    hidden
                    onChange={(e) => {
                        props.onAddFiles(Array.from(e.target.files ?? []));
                        e.target.value = "";
                    }}
                />
                <textarea
                    value={draft}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder={uploading ? "Envoi des images…" : placeholder}
                    aria-label={placeholder}
                    aria-describedby="composer-aide"
                    rows={1}
                    maxLength={MAX_LENGTH}
                    autoFocus
                />
                {draft.length > MAX_LENGTH - 200 && (
                    <span className="composer-counter">{MAX_LENGTH - draft.length}</span>
                )}
            </div>
        </div>
    );
}
