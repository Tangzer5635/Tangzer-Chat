import { useLayoutEffect, useRef } from "react";

/**
 * Ouvre un <dialog> natif en mode modal pendant toute la vie du composant.
 * Le navigateur s'occupe alors de l'essentiel :
 * - le reste de la page devient inerte (Tab reste dans la fenêtre) ;
 * - Échap déclenche l'événement « cancel » (à relier à onClose) ;
 * - les fenêtres imbriquées se ferment une par une.
 * En plus : le focus va au premier champ du formulaire, et revient à
 * l'élément d'origine à la fermeture.
 */
export function useModalDialog() {
    const ref = useRef<HTMLDialogElement>(null);

    useLayoutEffect(() => {
        const dialog = ref.current;
        if (!dialog) {
            return;
        }
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!dialog.open) {
            dialog.showModal();
        }
        const field = dialog.querySelector<HTMLElement>(
            "input:not([type=hidden]):not([type=file]):not([disabled]):not([hidden]), textarea:not([disabled]), select:not([disabled])",
        );
        (field ?? dialog).focus();

        return () => {
            if (dialog.open) {
                dialog.close();
            }
            if (previous?.isConnected) {
                previous.focus();
            }
        };
    }, []);

    return ref;
}
