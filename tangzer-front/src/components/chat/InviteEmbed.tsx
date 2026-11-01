import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { previewInvite } from "../../api/invites";
import type { InvitePreview } from "../../types/api";
import ServerIcon from "../ServerIcon";

/** Carte « Tu as été invité à rejoindre un serveur » sous un lien d'invitation. */
export default function InviteEmbed({ code }: { code: string }) {
    const navigate = useNavigate();
    const [preview, setPreview] = useState<InvitePreview | null>(null);
    const [broken, setBroken] = useState(false);

    useEffect(() => {
        let cancelled = false;
        previewInvite(code)
            .then((data) => !cancelled && setPreview(data))
            .catch(() => !cancelled && setBroken(true));
        return () => {
            cancelled = true;
        };
    }, [code]);

    if (broken || !preview) {
        return null;
    }

    return (
        <div className="invite-embed">
            <p className="invite-embed-title">Tu as été invité à rejoindre un serveur</p>
            <div className="invite-embed-row">
                <ServerIcon server={preview.server} size={48} />
                <div className="invite-embed-text">
                    <strong>{preview.server.name}</strong>
                    <span><i className="dot" /> {preview.server.memberCount} membre{preview.server.memberCount > 1 ? "s" : ""}</span>
                </div>
                <button
                    className={preview.server.joined ? "button-secondary" : "button-success"}
                    disabled={!preview.valid && !preview.server.joined}
                    onClick={() => navigate(preview.server.joined ? `/app/servers/${preview.server.id}` : `/invite/${code}`)}
                >
                    {preview.server.joined ? "Ouvrir" : preview.valid ? "Rejoindre" : "Expirée"}
                </button>
            </div>
        </div>
    );
}
