/**
 * Message affiché quand on rejoint un appel sans micro : l'appel reste
 * possible, on écoute sans parler.
 */
export function listenOnlyReason(error: unknown): string {
    if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "SecurityError") {
            return "Accès au micro refusé : tu rejoins en écoute seule. Autorise le micro dans ton navigateur pour parler.";
        }
        if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
            return "Aucun micro détecté : tu rejoins en écoute seule.";
        }
    }
    return "Micro indisponible : tu rejoins en écoute seule.";
}

/** Sans HTTPS, le navigateur ne donne pas accès au micro. */
export const INSECURE_LISTEN_ONLY = "Sans HTTPS, le micro n'est pas disponible : tu rejoins en écoute seule.";
