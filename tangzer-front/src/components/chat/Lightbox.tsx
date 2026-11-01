import { useEffect, useState } from "react";

import { formatBytes } from "../../lib/attachments";
import type { Attachment } from "../../types/api";

interface LightboxProps {
    attachments: Attachment[];
    startIndex: number;
    onClose: () => void;
}

/** Image en grand : Échap ou clic à côté pour fermer, flèches pour passer d'une image à l'autre. */
export default function Lightbox({ attachments, startIndex, onClose }: LightboxProps) {
    const [index, setIndex] = useState(startIndex);
    const current = attachments[index];
    const count = attachments.length;

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
            if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [count, onClose]);

    return (
        <div className="lightbox" onClick={onClose} role="dialog" aria-label={current.fileName}>
            <img src={current.url} alt={current.fileName} onClick={(e) => e.stopPropagation()} />
            <div className="lightbox-info" onClick={(e) => e.stopPropagation()}>
                <span>{current.fileName} · {formatBytes(current.size)}
                    {current.width && current.height ? ` · ${current.width}×${current.height}` : ""}
                    {count > 1 ? ` · ${index + 1}/${count}` : ""}</span>
                <a href={current.url} target="_blank" rel="noopener noreferrer">Ouvrir l'original</a>
            </div>
            {count > 1 && (
                <>
                    <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + count) % count); }} aria-label="Précédente">‹</button>
                    <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % count); }} aria-label="Suivante">›</button>
                </>
            )}
        </div>
    );
}
