import { describe, expect, it } from "vitest";

import { AA_GRAPHIC, AA_TEXT, contrastRatio } from "../lib/contrast";
import css from "./tokens.css?raw";

/**
 * Garde-fou : chaque association de couleurs utilisée par l'interface doit
 * atteindre le niveau WCAG AA, en mode clair comme en mode sombre.
 * Les valeurs sont lues directement dans tokens.css.
 */

type Mode = "clair" | "sombre";

function readTokens(): Record<Mode, Record<string, string>> {
    const tokens: Record<Mode, Record<string, string>> = { clair: {}, sombre: {} };
    for (const [, name, light, dark] of css.matchAll(/--([\w-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi)) {
        tokens.clair[name] = light;
        tokens.sombre[name] = dark;
    }
    return tokens;
}

const TOKENS = readTokens();

const TEXTS = ["text-title", "text-default", "text-mention"];
const SURFACES = ["bg-default", "bg-alt", "bg-contrast", "bg-hover", "bg-raised", "brand-subtle", "accent-subtle"];
const STATUSES = ["info", "success", "warning", "error"];

/** [premier plan, fond, seuil] */
const PAIRS: [string, string, number][] = [
    // Tous les textes sur toutes les surfaces.
    ...TEXTS.flatMap((text) => SURFACES.map((bg): [string, string, number] => [text, bg, AA_TEXT])),
    // Les textes sur les fonds d'alerte.
    ...STATUSES.flatMap((s): [string, string, number][] => [["text-title", `${s}-bg`, AA_TEXT], ["text-default", `${s}-bg`, AA_TEXT]]),
    // Liens et éléments de marque.
    ...["bg-default", "bg-alt", "bg-raised", "brand-subtle"].map((bg): [string, string, number] => ["brand", bg, AA_TEXT]),
    ["on-brand", "brand", AA_TEXT],
    ["on-brand", "brand-hover", AA_TEXT],
    ["on-accent", "accent", AA_TEXT],
    ["accent", "bg-default", AA_TEXT],
    ["accent", "accent-subtle", AA_TEXT],
    // Couleurs d'état : en texte et en fond plein.
    ...STATUSES.flatMap((s): [string, string, number][] => [
        [s, "bg-default", AA_TEXT],
        [s, "bg-alt", AA_TEXT],
        [s, `${s}-bg`, AA_TEXT],
        ["on-status", s, AA_TEXT],
    ]),
    ["on-status", "error-hover", AA_TEXT],
    // Éléments graphiques : contours de champs, focus, pastilles de présence.
    ...["bg-default", "bg-alt", "bg-contrast"].map((bg): [string, string, number] => ["border-control", bg, AA_GRAPHIC]),
    ...["bg-default", "bg-alt", "bg-raised"].map((bg): [string, string, number] => ["focus", bg, AA_GRAPHIC]),
    ...["presence-online", "presence-idle", "presence-dnd", "presence-offline"].flatMap((p) =>
        ["bg-default", "bg-alt", "bg-raised"].map((bg): [string, string, number] => [p, bg, AA_GRAPHIC])),
];

describe("tokens.css", () => {
    it("définit chaque couleur pour les deux modes", () => {
        expect(Object.keys(TOKENS.clair).length).toBeGreaterThan(30);
        expect(Object.keys(TOKENS.sombre)).toEqual(Object.keys(TOKENS.clair));
    });

    for (const mode of ["clair", "sombre"] as Mode[]) {
        it(`respecte les contrastes WCAG AA en mode ${mode}`, () => {
            const failures = PAIRS.flatMap(([fg, bg, min]) => {
                const a = TOKENS[mode][fg];
                const b = TOKENS[mode][bg];
                if (!a || !b) {
                    return [`variable manquante : --${a ? bg : fg}`];
                }
                const ratio = contrastRatio(a, b);
                return ratio >= min ? [] : [`--${fg} sur --${bg} : ${ratio.toFixed(2)} < ${min}`];
            });
            expect(failures).toEqual([]);
        });
    }
});
