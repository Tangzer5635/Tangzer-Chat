import type { Appearance, ThemeId } from "../types/api";

/**
 * Apparence : thème (clair, sombre ou selon l'appareil), taille du texte des
 * messages et mode compact. Le thème ne fait que poser data-theme sur <html> :
 * les couleurs elles-mêmes sont dans styles/tokens.css.
 */

export interface ThemeInfo {
    id: ThemeId;
    label: string;
    description: string;
}

export const THEMES: ThemeInfo[] = [
    { id: "system", label: "Selon l'appareil", description: "Clair ou sombre, comme le réglage de ton ordinateur ou de ton téléphone." },
    { id: "light", label: "Clair", description: "Fond blanc et texte noir." },
    { id: "dark", label: "Sombre", description: "Fond noir et texte clair, plus reposant le soir." },
];

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 20;

export const DEFAULT_APPEARANCE: Appearance = { theme: "system", fontSize: 16, compact: false };

/**
 * Remet d'aplomb une apparence venue du stockage local ou d'une ancienne
 * version (thèmes « neon », « sakura »… qui n'existent plus).
 */
export function normalizeAppearance(value: unknown): Appearance {
    const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const theme = THEMES.some((t) => t.id === raw.theme) ? (raw.theme as ThemeId) : DEFAULT_APPEARANCE.theme;
    const fontSize = typeof raw.fontSize === "number" && Number.isFinite(raw.fontSize)
        ? Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(raw.fontSize)))
        : DEFAULT_APPEARANCE.fontSize;
    const compact = typeof raw.compact === "boolean" ? raw.compact : DEFAULT_APPEARANCE.compact;
    return { theme, fontSize, compact };
}

const STORAGE_KEY = "tangzer.appearance";

/** Applique l'apparence à la page (et la retient pour le prochain chargement). */
export function applyAppearance(appearance: Appearance) {
    const { theme, fontSize, compact } = normalizeAppearance(appearance);
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.compact = String(compact);
    root.style.setProperty("--font-scale", String(fontSize / 16));

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, fontSize, compact }));
    } catch {
        // Stockage indisponible : l'apparence sera réappliquée après la connexion.
    }
}

/** Au démarrage, avant même la connexion : reprend la dernière apparence connue. */
export function applyStoredAppearance() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        applyAppearance(normalizeAppearance(stored ? JSON.parse(stored) : null));
    } catch {
        applyAppearance(DEFAULT_APPEARANCE);
    }
}
