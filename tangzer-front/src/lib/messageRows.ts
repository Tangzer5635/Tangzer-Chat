import type { Message } from "../types/api";

/**
 * Prépare l'affichage du fil : séparateurs de jour, et en-tête (avatar + nom)
 * seulement au début d'une série de messages du même auteur.
 */

/** Au-delà de 5 minutes de silence, on réaffiche l'en-tête. */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type MessageRow =
    | { kind: "day"; key: string; label: string }
    | { kind: "message"; key: string; message: Message; showHeader: boolean };

export function buildRows(messages: Message[], now: Date = new Date()): MessageRow[] {
    const rows: MessageRow[] = [];
    let previous: Message | null = null;

    for (const message of messages) {
        const newDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
        if (newDay) {
            rows.push({ kind: "day", key: `day-${message.createdAt.slice(0, 10)}-${message.id}`, label: dayLabel(message.createdAt, now) });
        }

        const showHeader = newDay
            || previous === null
            || previous.author.id !== message.author.id
            || message.replyTo !== null
            || new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() > GROUP_WINDOW_MS;

        rows.push({ kind: "message", key: message.nonce ?? String(message.id), message, showHeader });
        previous = message;
    }
    return rows;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

/** « Aujourd'hui », « Hier » ou « mardi 3 mars 2026 ». */
export function dayLabel(iso: string, now: Date = new Date()): string {
    if (isSameDay(iso, now)) {
        return "Aujourd'hui";
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(iso, yesterday)) {
        return "Hier";
    }
    return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
}

/** « Alice est en train d'écrire… », « Alice et Bob sont… », « Plusieurs personnes… ». */
export function typingLabel(names: string[]): string | null {
    if (names.length === 0) {
        return null;
    }
    if (names.length === 1) {
        return `${names[0]} est en train d'écrire…`;
    }
    if (names.length <= 3) {
        return `${names.slice(0, -1).join(", ")} et ${names.at(-1)} sont en train d'écrire…`;
    }
    return "Plusieurs personnes sont en train d'écrire…";
}
