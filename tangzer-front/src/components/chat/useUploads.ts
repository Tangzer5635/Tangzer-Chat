import { useCallback, useEffect, useRef, useState } from "react";

import { uploadAttachment } from "../../api/attachments";
import { MAX_IMAGES_PER_MESSAGE, validateImageFile } from "../../lib/attachments";
import { randomId } from "../../lib/id";
import type { Attachment } from "../../types/api";

export interface UploadItem {
    key: string;
    file: File;
    /** Aperçu local, avant même la fin de l'envoi. */
    previewUrl: string;
    progress: number;
    attachment: Attachment | null;
    error: string | null;
}

/**
 * Images en attente d'envoi : chaque image part vers le serveur dès qu'on la choisit,
 * le message n'a plus qu'à citer les identifiants reçus.
 */
export function useUploads(onError: (message: string) => void) {
    const [items, setItems] = useState<UploadItem[]>([]);
    const itemsRef = useRef<UploadItem[]>([]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // Libère les aperçus locaux quand on quitte le salon.
    useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

    const update = (key: string, change: Partial<UploadItem>) =>
        setItems((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));

    const addFiles = useCallback((files: File[]) => {
        const room = MAX_IMAGES_PER_MESSAGE - itemsRef.current.length;
        if (files.length > room) {
            onError(`${MAX_IMAGES_PER_MESSAGE} images maximum par message.`);
        }

        for (const file of files.slice(0, Math.max(0, room))) {
            const error = validateImageFile(file);
            if (error) {
                onError(error);
                continue;
            }
            const item: UploadItem = {
                key: randomId(),
                file,
                previewUrl: URL.createObjectURL(file),
                progress: 0,
                attachment: null,
                error: null,
            };
            setItems((current) => [...current, item]);
            uploadAttachment(file, (progress) => update(item.key, { progress }))
                .then((attachment) => update(item.key, { attachment, progress: 100 }))
                .catch((err) => update(item.key, { error: err instanceof Error ? err.message : "Échec de l'envoi" }));
        }
    }, [onError]);

    const remove = useCallback((key: string) => {
        setItems((current) => {
            current.filter((item) => item.key === key).forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return current.filter((item) => item.key !== key);
        });
    }, []);

    /** Vide la liste après l'envoi du message (il affiche désormais les images du serveur). */
    const clear = useCallback(() => {
        setItems((current) => {
            current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            return [];
        });
    }, []);

    const uploading = items.some((item) => !item.attachment && !item.error);
    const attachments = items.flatMap((item) => (item.attachment ? [item.attachment] : []));

    return { items, addFiles, remove, clear, uploading, attachments };
}
