import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { acceptInvite, previewInvite } from "../api/invites";
import ServerIcon from "../components/ServerIcon";
import { useServers } from "../context/servers";
import { describeExpiry } from "../lib/invites";
import type { InvitePreview } from "../types/api";

/** /invite/:code : aperçu du serveur puis acceptation de l'invitation. */
export default function InvitePage() {
    const { code = "" } = useParams();
    const navigate = useNavigate();
    const { dispatch } = useServers();

    const [preview, setPreview] = useState<InvitePreview | null>(null);
    const [error, setError] = useState("");
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        let cancelled = false;
        previewInvite(code)
            .then((data) => !cancelled && setPreview(data))
            .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Invitation invalide."));
        return () => {
            cancelled = true;
        };
    }, [code]);

    const accept = async () => {
        setJoining(true);
        try {
            const server = await acceptInvite(code);
            dispatch({ type: "serverUpserted", server });
            navigate(`/app/servers/${server.id}`, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de rejoindre ce serveur.");
            setJoining(false);
        }
    };

    return (
        <div className="invite-page">
            <div className="invite-card">
                {!preview && !error && <p>Chargement de l'invitation…</p>}

                {error && !preview && (
                    <>
                        <div className="invite-broken">🔗</div>
                        <h1>Invitation invalide</h1>
                        <p className="invite-subtitle">{error}</p>
                        <Link to="/app" className="button-primary">Retour à Tangzer</Link>
                    </>
                )}

                {preview && (
                    <>
                        <ServerIcon server={preview.server} size={88} />
                        <p className="invite-subtitle">{preview.inviter.displayName} t'invite à rejoindre</p>
                        <h1>{preview.server.name}</h1>
                        {preview.server.description && <p className="invite-description">{preview.server.description}</p>}
                        <p className="invite-members">
                            <i className="dot" /> {preview.server.memberCount} membre{preview.server.memberCount > 1 ? "s" : ""}
                        </p>

                        {error && <p className="form-error">{error}</p>}

                        {preview.server.joined ? (
                            <button className="button-primary big" onClick={() => navigate(`/app/servers/${preview.server.id}`)}>
                                Tu es déjà membre — Ouvrir
                            </button>
                        ) : preview.valid ? (
                            <>
                                <button className="button-primary big" onClick={accept} disabled={joining}>
                                    {joining ? "Connexion…" : "Accepter l'invitation"}
                                </button>
                                <p className="form-hint">Cette invitation {describeExpiry(preview.expiresAt)}.</p>
                            </>
                        ) : (
                            <p className="form-error">Cette invitation a expiré ou a atteint sa limite d'utilisations.</p>
                        )}

                        <Link to="/app" className="invite-back">Pas maintenant</Link>
                    </>
                )}
            </div>
        </div>
    );
}
