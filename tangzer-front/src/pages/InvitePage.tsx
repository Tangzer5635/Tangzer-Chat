import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { acceptInvite, previewInvite } from "../api/invites";
import ServerIcon from "../components/ServerIcon";
import { useServers } from "../context/servers";
import { describeExpiry } from "../lib/invites";
import type { InvitePreview } from "../types/api";
import { APP_NAME } from "../lib/brand";
import Logo from "../components/Logo";
import Alert from "../components/ui/Alert";

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
        <main className="invite-page">
            <div className="invite-card">
                <Logo size={40} withName />
                {!preview && !error && <p>Chargement de l'invitation…</p>}

                {error && !preview && (
                    <>
                        <h1>Invitation invalide</h1>
                        <Alert tone="error">{error}</Alert>
                        <Link to="/app" className="button-primary">Retour à {APP_NAME}</Link>
                    </>
                )}

                {preview && (
                    <>
                        <ServerIcon server={preview.server} size={80} />
                        <p className="invite-subtitle">{preview.inviter.displayName} t'invite à rejoindre</p>
                        <h1>{preview.server.name}</h1>
                        {preview.server.description && <p className="invite-description">{preview.server.description}</p>}
                        <p className="invite-members">
                            <Users size={16} /> {preview.server.memberCount} membre{preview.server.memberCount > 1 ? "s" : ""}
                        </p>

                        {error && <Alert tone="error">{error}</Alert>}

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
                            <Alert tone="warning">Cette invitation a expiré ou a atteint sa limite d'utilisations.</Alert>
                        )}

                        <Link to="/app" className="invite-back">Pas maintenant</Link>
                    </>
                )}
            </div>
        </main>
    );
}
