import type { Appearance, ThemeId } from "../types/api";

/**
 * Thèmes et apparence : un thème = un jeu de variables CSS (voir App.css,
 * [data-theme=…]). La couleur d'accent, la taille du texte et le mode compact
 * s'appliquent par-dessus.
 */

export interface ThemeInfo {
    id: ThemeId;
    label: string;
    /** Couleurs pour l'aperçu dans les paramètres : rail, barre latérale, discussion, accent. */
    preview: [string, string, string, string];
}

export const THEMES: ThemeInfo[] = [
    { id: "tangzer", label: "Tangzer", preview: ["#1e1f22", "#2b2d31", "#313338", "#5865f2"] },
    { id: "minuit", label: "Minuit", preview: ["#000000", "#0b0b0d", "#111214", "#5865f2"] },
    { id: "clair", label: "Clair", preview: ["#e3e5e8", "#f2f3f5", "#ffffff", "#5865f2"] },
    { id: "neon", label: "Néon", preview: ["#0d0221", "#150534", "#1b0742", "#ff2a6d"] },
    { id: "sakura", label: "Sakura", preview: ["#f4d9e4", "#fbe9f0", "#fff5f9", "#e75480"] },
    { id: "foret", label: "Forêt", preview: ["#0f1a14", "#15241b", "#1b2e22", "#3ba55c"] },
];

export const ACCENT_COLORS = ["#5865f2", "#eb459e", "#3ba55c", "#faa61a", "#ed4245", "#9b59b6", "#1abc9c", "#00a8fc"];

export const DEFAULT_APPEARANCE: Appearance = { theme: "tangzer", accentColor: null, fontSize: 16, compact: false };

export function isHexColor(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Assombrit une couleur #rrggbb (amount de 0 à 1). */
export function darken(hex: string, amount: number): string {
    const value = parseInt(hex.slice(1), 16);
    const channel = (shift: number) => Math.max(0, Math.round(((value >> shift) & 0xff) * (1 - amount)));
    return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

/** Texte noir ou blanc, selon ce qui se lit le mieux sur cette couleur. */
export function contrastText(hex: string): string {
    const value = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#060607" : "#ffffff";
}

const STORAGE_KEY = "tangzer.appearance";

/** Applique l'apparence à la page (et la retient pour le prochain chargement). */
export function applyAppearance(appearance: Appearance) {
    const root = document.documentElement;
    root.dataset.theme = appearance.theme;
    root.dataset.compact = String(appearance.compact);
    root.style.setProperty("--font-scale", String(appearance.fontSize / 16));

    if (appearance.accentColor && isHexColor(appearance.accentColor)) {
        root.style.setProperty("--accent", appearance.accentColor);
        root.style.setProperty("--accent-hover", darken(appearance.accentColor, 0.15));
        root.style.setProperty("--accent-text", contrastText(appearance.accentColor));
    } else {
        root.style.removeProperty("--accent");
        root.style.removeProperty("--accent-hover");
        root.style.removeProperty("--accent-text");
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
        // Stockage indisponible : l'apparence sera réappliquée après la connexion.
    }
}

/** Au démarrage, avant même la connexion : reprend la dernière apparence connue. */
export function applyStoredAppearance() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        applyAppearance(stored ? { ...DEFAULT_APPEARANCE, ...JSON.parse(stored) } : DEFAULT_APPEARANCE);
    } catch {
        applyAppearance(DEFAULT_APPEARANCE);
    }
}
