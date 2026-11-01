import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { useState } from "react";

import { formatBytes } from "../../lib/attachments";
import type { Attachment } from "../../types/api";
import { useModalDialog } from "../ui/useModalDialog";

interface LightboxProps {
    attachments: Attachment[];
    startIndex: number;
    onClose: () => void;
}

/** Image en grand : Échap ou clic à côté pour fermer, flèches pour passer d'une image à l'autre. */
export default function Lightbox({ attachments, startIndex, onClose }: LightboxProps) {
    const [index, setIndex] = useState(startIndex);
    const ref = useModalDialog();
    const current = attachments[index];
    const count = attachments.length;
    const previous = () => setIndex((i) => (i - 1 + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);

    return (
        <dialog
            ref={ref}
            className="lightbox"
            aria-label={`Image : ${current.fileName}`}
            tabIndex={-1}
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            onKeyDown={(e) => {
                if (count > 1 && e.key === "ArrowRight") next();
                if (count > 1 && e.key === "ArrowLeft") previous();
            }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <figure className="lightbox-figure">
                <img src={current.url} alt={current.fileName} />
                <figcaption className="lightbox-info">
                    <span>
                        {current.fileName} · {formatBytes(current.size)}
                        {current.width && current.height ? ` · ${current.width}×${current.height}` : ""}
                        {count > 1 ? ` · ${index + 1} sur ${count}` : ""}
                    </span>
                    <a href={current.url} target="_blank" rel="noopener noreferrer">
                        Ouvrir l'original <ExternalLink size={14} />
                        <span className="sr-only">(nouvel onglet)</span>
                    </a>
                </figcaption>
            </figure>
            <button type="button" className="lightbox-button lightbox-close" onClick={onClose} aria-label="Fermer">
                <X size={24} />
            </button>
            {count > 1 && (
                <>
                    <button type="button" className="lightbox-button lightbox-nav prev" onClick={previous} aria-label="Image précédente">
                        <ChevronLeft size={28} />
                    </button>
                    <button type="button" className="lightbox-button lightbox-nav next" onClick={next} aria-label="Image suivante">
                        <ChevronRight size={28} />
                    </button>
                </>
            )}
        </dialog>
    );
}
