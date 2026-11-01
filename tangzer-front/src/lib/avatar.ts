/** Couleurs des avatars par défaut (initiales blanches lisibles, niveau AA). */
const AVATAR_COLORS = ["#6b2f73", "#00636b", "#9a5500", "#1c6a43", "#0b5fa5", "#a63a2b", "#4b4a9e", "#9b2f5c"];

/** Couleur stable pour un identifiant (le même utilisateur garde toujours la même). */
export function colorFor(id: number): string {
    return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

/** « Groupe Fond à droite » → « GF », « tanguy » → « T ». Gère les emojis. */
export function initials(name: string, max = 2): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    return words
        .slice(0, max)
        .map((word) => Array.from(word)[0]?.toUpperCase() ?? "")
        .join("");
}
