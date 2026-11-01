import { useNavigate } from "react-router-dom";

import { useCalls } from "../../context/calls";
import Avatar from "../Avatar";

/** « Tanguy t'appelle… » : accepter ou refuser. */
export default function IncomingCallModal() {
    const { incoming, acceptIncoming, declineIncoming } = useCalls();
    const navigate = useNavigate();

    if (!incoming) {
        return null;
    }

    return (
        <div className="incoming-call" role="alertdialog" aria-label={`Appel de ${incoming.caller.displayName}`}>
            <div className="incoming-call-avatar">
                <Avatar user={incoming.caller} size={96} />
            </div>
            <strong>{incoming.caller.displayName}</strong>
            <span>t'appelle…</span>
            <div className="incoming-call-actions">
                <button className="call-button large hang-up" onClick={declineIncoming} title="Refuser"><span>📞</span></button>
                <button
                    className="call-button large accept"
                    onClick={() => {
                        acceptIncoming();
                        navigate(`/app/dm/${incoming.channelId}`);
                    }}
                    title="Accepter"
                >
                    📞
                </button>
            </div>
        </div>
    );
}
