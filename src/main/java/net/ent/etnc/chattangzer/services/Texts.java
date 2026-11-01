package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;

/**
 * Petites règles de validation de texte partagées par les services.
 * Les longueurs sont comptées en caractères réels (un emoji = 1).
 */
public final class Texts {

    private Texts() {
    }

    /** Nombre de caractères visibles (points de code Unicode). */
    public static int length(String text) {
        return text.codePointCount(0, text.length());
    }

    /** Supprime les espaces en trop ; null devient "". */
    public static String clean(String raw) {
        return raw == null ? "" : raw.strip().replaceAll("\\s+", " ");
    }

    /** Texte obligatoire entre min et max caractères. */
    public static String required(String raw, int min, int max, String label) {
        String text = clean(raw);
        int length = length(text);
        if (length < min || length > max) {
            throw ApiException.badRequest(label + " doit faire entre " + min + " et " + max + " caractères");
        }
        return text;
    }

    /** Texte facultatif : null si vide, erreur si trop long. */
    public static String optional(String raw, int max, String label) {
        String text = clean(raw);
        if (text.isEmpty()) {
            return null;
        }
        if (length(text) > max) {
            throw ApiException.badRequest(label + " ne doit pas dépasser " + max + " caractères");
        }
        return text;
    }
}
