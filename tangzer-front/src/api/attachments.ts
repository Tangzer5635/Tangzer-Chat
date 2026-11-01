import { ApiError, getToken, notifyUnauthorized } from "./http";
import type { Attachment } from "../types/api";

/**
 * Envoie une image. On passe par XMLHttpRequest (et non fetch) pour suivre
 * la progression de l'envoi et afficher une barre.
 */
export function uploadAttachment(file: File, onProgress: (percent: number) => void): Promise<Attachment> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", file);

        request.open("POST", "/api/attachments");
        const token = getToken();
        if (token) {
            request.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        request.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                resolve(JSON.parse(request.responseText) as Attachment);
                return;
            }
            if (request.status === 401) {
                notifyUnauthorized();
            }
            let message = "Envoi de l'image impossible.";
            try {
                message = JSON.parse(request.responseText).message ?? message;
            } catch {
                // réponse non JSON
            }
            reject(new ApiError(request.status, message));
        };

        request.onerror = () => reject(new ApiError(0, "Connexion perdue pendant l'envoi de l'image."));
        request.send(form);
    });
}
