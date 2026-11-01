/**
 * Navigation au clavier dans une liste d'onglets : renvoie l'index de
 * l'onglet à sélectionner pour une touche donnée, ou null si la touche ne
 * concerne pas les onglets. La liste boucle aux extrémités.
 */
export function nextTabIndex(
    key: string,
    current: number,
    count: number,
    orientation: "horizontal" | "vertical" = "horizontal",
): number | null {
    if (count === 0) {
        return null;
    }
    const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    switch (key) {
        case previousKey:
            return (current - 1 + count) % count;
        case nextKey:
            return (current + 1) % count;
        case "Home":
            return 0;
        case "End":
            return count - 1;
        default:
            return null;
    }
}
