/**
 * Recadrage des photos de profil et icônes de serveur : un carré centré,
 * réduit à 256 px. L'image envoyée est plus légère et toujours bien cadrée.
 */

export interface SquareCrop {
    sx: number;
    sy: number;
    size: number;
}

/** Le plus grand carré centré dans une image width × height. */
export function centeredSquare(width: number, height: number): SquareCrop {
    const size = Math.min(width, height);
    return { sx: Math.floor((width - size) / 2), sy: Math.floor((height - size) / 2), size };
}

export async function cropToSquare(file: File, outputSize = 256): Promise<File> {
    // Les GIF animés gardent leur animation : on ne les recadre pas.
    if (file.type === "image/gif") {
        return file;
    }
    const bitmap = await createImageBitmap(file);
    const { sx, sy, size } = centeredSquare(bitmap.width, bitmap.height);
    const target = Math.min(outputSize, size);

    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    canvas.getContext("2d")?.drawImage(bitmap, sx, sy, size, size, 0, 0, target, target);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
        return file;
    }
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".png", { type: "image/png" });
}
