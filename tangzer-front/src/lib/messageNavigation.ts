/**
 * Navigation au clavier dans le fil de messages.
 * `current` vaut -1 quand le focus est sur le fil lui-même (aucun message).
 * Renvoie l'index du message à focaliser, ou null si la touche ne fait rien.
 * Pas de bouclage : on s'arrête au premier et au dernier message.
 */
export function messageFocusIndex(key: string, current: number, count: number): number | null {
    if (count === 0) {
        return null;
    }
    switch (key) {
        case "ArrowUp":
            // Depuis le fil : on commence par le message le plus récent (en bas).
            return current === -1 ? count - 1 : Math.max(0, current - 1);
        case "ArrowDown":
            return current === -1 ? count - 1 : Math.min(count - 1, current + 1);
        case "Home":
            return 0;
        case "End":
            return count - 1;
        default:
            return null;
    }
}
