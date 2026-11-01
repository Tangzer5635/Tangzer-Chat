/** Règles et calculs autour des images (mêmes limites que le backend). */

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_MESSAGE = 4;

/** Message d'erreur si le fichier ne peut pas être envoyé, sinon null. */
export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return `« ${file.name} » n'est pas une image (PNG, JPEG, GIF ou WEBP).`;
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return `« ${file.name} » est trop lourde (${formatBytes(file.size)}, 10 Mo maximum).`;
    }
    return null;
}

/** 1536 → « 1,5 Ko », 3 145 728 → « 3 Mo ». */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} o`;
    }
    const units = ["Ko", "Mo", "Go"];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${String(rounded).replace(".", ",")} ${units[unit]}`;
}

/** Taille d'affichage qui rentre dans le cadre en gardant les proportions (sans agrandir). */
export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
    const ratio = Math.min(1, maxWidth / width, maxHeight / height);
    return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}
