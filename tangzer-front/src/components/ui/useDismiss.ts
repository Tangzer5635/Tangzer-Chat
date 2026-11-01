import { useEffect, useEffectEvent, type RefObject } from "react";

/**
 * Pour un menu ou un panneau qui s'ouvre sous un bouton : se ferme avec
 * Échap (et rend alors le focus au bouton) ou par un clic ailleurs.
 */
export function useDismiss(
    open: boolean,
    onClose: () => void,
    container: RefObject<HTMLElement | null>,
    trigger?: RefObject<HTMLElement | null>,
) {
    const close = useEffectEvent(onClose);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                close();
                trigger?.current?.focus();
            }
        };
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node;
            if (!container.current?.contains(target) && !trigger?.current?.contains(target)) {
                close();
            }
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [open, container, trigger]);
}
