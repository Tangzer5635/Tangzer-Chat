/** Choix proposés à la création d'un serveur (mêmes couleurs que le backend). */

export const SERVER_ICONS = [
    "🎮", "🎵", "📚", "💻", "🎨", "⚽", "🍕", "🚀",
    "🌙", "🔥", "🐱", "🌈", "🎬", "✈️", "🏰", "🧪",
];

export const SERVER_COLORS = [
    "#5865f2", "#eb459e", "#3ba55c", "#faa61a", "#ed4245",
    "#9b59b6", "#1abc9c", "#e67e22", "#3498db", "#e91e63",
];

export const INVITE_DURATIONS: { label: string; hours: number | null }[] = [
    { label: "1 heure", hours: 1 },
    { label: "24 heures", hours: 24 },
    { label: "7 jours", hours: 24 * 7 },
    { label: "30 jours", hours: 24 * 30 },
    { label: "Jamais", hours: null },
];

export const INVITE_MAX_USES: { label: string; uses: number | null }[] = [
    { label: "Illimité", uses: null },
    { label: "1 utilisation", uses: 1 },
    { label: "5 utilisations", uses: 5 },
    { label: "10 utilisations", uses: 10 },
    { label: "25 utilisations", uses: 25 },
    { label: "100 utilisations", uses: 100 },
];

/** Réactions proposées au survol d'un message. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];
