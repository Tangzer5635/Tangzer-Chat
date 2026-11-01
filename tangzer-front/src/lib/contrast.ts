/**
 * Contrastes selon les WCAG 2 : luminance relative et rapport de contraste
 * entre deux couleurs #rrggbb. Niveau AA : 4,5:1 pour du texte, 3:1 pour
 * un élément graphique (contour de champ, pastille, anneau de focus).
 */

export const AA_TEXT = 4.5;
export const AA_GRAPHIC = 3;

const DARK_TEXT = "#161616";
const LIGHT_TEXT = "#ffffff";

export function isHexColor(value: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Luminance relative d'une couleur #rrggbb (0 = noir, 1 = blanc). */
export function luminance(hex: string): number {
    const value = parseInt(hex.slice(1), 16);
    const channel = (shift: number) => {
        const c = ((value >> shift) & 0xff) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

/** Rapport de contraste entre deux couleurs, de 1 à 21. */
export function contrastRatio(a: string, b: string): number {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

/**
 * Texte (blanc ou presque noir) le plus lisible sur un fond donné.
 * L'un des deux atteint toujours au moins 4,5:1, quelle que soit la couleur.
 */
export function readableTextOn(background: string): string {
    if (!isHexColor(background)) {
        return LIGHT_TEXT;
    }
    return contrastRatio(LIGHT_TEXT, background) >= contrastRatio(DARK_TEXT, background) ? LIGHT_TEXT : DARK_TEXT;
}
