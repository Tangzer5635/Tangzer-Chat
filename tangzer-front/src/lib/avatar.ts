/** Couleurs des avatars par défaut. */
const AVATAR_COLORS = ["#5865f2", "#3ba55c", "#faa61a", "#ed4245", "#eb459e", "#9b59b6", "#1abc9c", "#e67e22"];

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
