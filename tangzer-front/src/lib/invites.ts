/**
 * Accepte un code d'invitation seul ou un lien complet :
 * "aB3dE5fG", "https://tangzer.lan/invite/aB3dE5fG", "/invite/aB3dE5fG".
 */
export function parseInviteCode(input: string): string | null {
    const text = input.trim();
    if (!text) {
        return null;
    }
    const match = text.match(/invite\/([A-Za-z0-9]+)\/?$/);
    if (match) {
        return match[1];
    }
    return /^[A-Za-z0-9]+$/.test(text) ? text : null;
}

export function inviteUrl(code: string, origin = window.location.origin): string {
    return `${origin}/invite/${code}`;
}

/** « expire dans 3 jours », « n'expire jamais »… */
export function describeExpiry(expiresAt: string | null, now: Date = new Date()): string {
    if (!expiresAt) {
        return "n'expire jamais";
    }
    const remainingMs = new Date(expiresAt).getTime() - now.getTime();
    if (remainingMs <= 0) {
        return "a expiré";
    }
    const minutes = Math.round(remainingMs / 60_000);
    if (minutes < 60) {
        return `expire dans ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 48) {
        return `expire dans ${hours} heure${hours > 1 ? "s" : ""}`;
    }
    const days = Math.round(hours / 24);
    return `expire dans ${days} jours`;
}
