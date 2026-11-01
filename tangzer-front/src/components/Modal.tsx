import { useEffect, type ReactNode } from "react";

interface ModalProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    /** Boutons affichés en bas de la fenêtre. */
    footer?: ReactNode;
    wide?: boolean;
}

/** Fenêtre modale : se ferme avec Échap ou en cliquant à côté. */
export default function Modal({ title, subtitle, onClose, children, footer, wide }: ModalProps) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className={wide ? "modal modal-wide" : "modal"} role="dialog" aria-modal="true" aria-label={title}>
                <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
                <div className="modal-header">
                    <h2>{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
