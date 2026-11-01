import { Phone, PhoneOff } from "lucide-react";
import { useId } from "react";
import { useNavigate } from "react-router-dom";

import { useCalls } from "../../context/calls";
import type { IncomingCall } from "../../types/api";
import Avatar from "../Avatar";
import { useModalDialog } from "../ui/useModalDialog";

/** Fenêtre « Tanguy t'appelle… » : Accepter ou Refuser (Échap refuse). */
function IncomingCallDialog({ incoming }: { incoming: IncomingCall }) {
    const { acceptIncoming, declineIncoming } = useCalls();
    const navigate = useNavigate();
    const ref = useModalDialog();
    const titleId = useId();

    return (
        <dialog
            ref={ref}
            className="incoming-call"
            role="alertdialog"
            aria-labelledby={titleId}
            tabIndex={-1}
            onCancel={(e) => {
                e.preventDefault();
                declineIncoming();
            }}
        >
            <div className="incoming-call-avatar">
                <Avatar user={incoming.caller} size={96} />
            </div>
            <h2 id={titleId}>
                {incoming.caller.displayName} <span>t'appelle…</span>
            </h2>
            <div className="incoming-call-actions">
                <button type="button" className="button-danger" onClick={declineIncoming}>
                    <PhoneOff size={20} />
                    Refuser
                </button>
                <button
                    type="button"
                    className="button-success"
                    onClick={() => {
                        acceptIncoming();
                        navigate(`/app/dm/${incoming.channelId}`);
                    }}
                >
                    <Phone size={20} />
                    Accepter
                </button>
            </div>
        </dialog>
    );
}

export default function IncomingCallModal() {
    const { incoming } = useCalls();
    // Une nouvelle fenêtre par appel (key) : le focus revient où il était après chaque appel.
    return incoming ? <IncomingCallDialog key={`${incoming.channelId}-${incoming.caller.id}`} incoming={incoming} /> : null;
}
