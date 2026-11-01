import { useState } from "react";

import { fitWithin } from "../../lib/attachments";
import type { Attachment } from "../../types/api";
import Lightbox from "./Lightbox";

/** Photos d'un message : une grande image, ou une grille pour plusieurs. */
export default function AttachmentGrid({ attachments }: { attachments: Attachment[] }) {
    const [opened, setOpened] = useState<number | null>(null);

    if (attachments.length === 0) {
        return null;
    }

    const single = attachments.length === 1;

    return (
        <>
            <div className={single ? "attachments single" : `attachments grid-${Math.min(attachments.length, 4)}`}>
                {attachments.map((attachment, index) => {
                    // Taille réservée à l'avance : le fil ne « saute » pas quand l'image arrive.
                    const size = single && attachment.width && attachment.height
                        ? fitWithin(attachment.width, attachment.height, 400, 300)
                        : null;
                    return (
                        <button
                            key={attachment.id}
                            className="attachment"
                            onClick={() => setOpened(index)}
                            title={attachment.fileName}
                            style={size ? { width: size.width, height: size.height } : undefined}
                        >
                            <img src={attachment.url} alt={attachment.fileName} loading="lazy" />
                        </button>
                    );
                })}
            </div>
            {opened !== null && (
                <Lightbox attachments={attachments} startIndex={opened} onClose={() => setOpened(null)} />
            )}
        </>
    );
}
