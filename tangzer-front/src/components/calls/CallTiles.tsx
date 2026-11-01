import { useCalls } from "../../context/calls";
import type { CallParticipant } from "../../types/api";
import Avatar from "../Avatar";

/** Les participants d'un appel : un grand avatar qui s'illumine quand la personne parle. */
export default function CallTiles({ participants }: { participants: CallParticipant[] }) {
    const { speaking } = useCalls();

    return (
        <div className={`call-tiles count-${Math.min(participants.length, 4)}`}>
            {participants.map((participant) => (
                <div
                    key={participant.user.id}
                    className={speaking.has(participant.user.id) && !participant.muted ? "call-tile speaking" : "call-tile"}
                >
                    <Avatar user={participant.user} size={80} />
                    <span className="call-tile-name">
                        {participant.user.displayName}
                        {participant.deafened ? " 🙉" : participant.muted ? " 🔇" : ""}
                    </span>
                </div>
            ))}
        </div>
    );
}
