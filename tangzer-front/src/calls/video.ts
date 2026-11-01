/**
 * Petites règles de l'affichage vidéo.
 */

/** Quelle image envoyer : l'écran partagé passe avant la caméra. */
export function pickVideoTrack(
    camera: MediaStreamTrack | null,
    screen: MediaStreamTrack | null,
): MediaStreamTrack | null {
    return screen ?? camera;
}

/** Nombre de colonnes de la grille selon le nombre de participants. */
export function gridColumns(count: number): number {
    if (count <= 1) {
        return 1;
    }
    if (count <= 4) {
        return 2;
    }
    if (count <= 9) {
        return 3;
    }
    return 4;
}

/** Les tuiles en vedette d'abord (celle qu'on a agrandie, ou les écrans partagés). */
export function orderTiles<T extends { userId: number; screen: boolean }>(tiles: T[], focusedUserId: number | null): T[] {
    const score = (tile: T) => (tile.userId === focusedUserId ? 2 : tile.screen ? 1 : 0);
    return [...tiles].sort((a, b) => score(b) - score(a));
}
