import { X } from "lucide-react";
import { useId, type ReactNode } from "react";

import { useModalDialog } from "./ui/useModalDialog";

interface ModalProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    /** Boutons affichés en bas de la fenêtre. */
    footer?: ReactNode;
    wide?: boolean;
}

/**
 * Fenêtre modale (élément <dialog> natif) : titre, contenu, boutons.
 * Se ferme avec Échap, le bouton « Fermer » ou un clic à côté.
 */
export default function Modal({ title, subtitle, onClose, children, footer, wide }: ModalProps) {
    const ref = useModalDialog();
    const titleId = useId();
    const subtitleId = useId();

    return (
        <dialog
            ref={ref}
            className={wide ? "modal modal-wide" : "modal"}
            aria-labelledby={titleId}
            aria-describedby={subtitle ? subtitleId : undefined}
            tabIndex={-1}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            // Le contenu remplit la fenêtre : un clic sur le <dialog> lui-même est un clic sur le fond.
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-inner">
                <div className="modal-header">
                    <h2 id={titleId}>{title}</h2>
                    {subtitle && <p id={subtitleId}>{subtitle}</p>}
                    <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Fermer">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </dialog>
    );
}
