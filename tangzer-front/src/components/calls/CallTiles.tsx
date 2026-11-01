import { useEffect, useRef, useState } from "react";

import { gridColumns, orderTiles } from "../../calls/video";
import { useAuth } from "../../context/auth";
import { useCalls } from "../../context/calls";
import type { CallParticipant } from "../../types/api";
import Avatar from "../Avatar";

/** Affiche un flux vidéo (le son est joué à part). */
function Video({ stream, mirrored }: { stream: MediaStream; mirrored: boolean }) {
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.srcObject = stream;
        }
    }, [stream]);
    return <video ref={ref} className={mirrored ? "mirrored" : undefined} autoPlay playsInline muted />;
}

interface TileProps {
    participant: CallParticipant;
    speaking: boolean;
    stream: MediaStream | null;
    isMe: boolean;
    focused: boolean;
    onFocus: () => void;
}

function Tile({ participant, speaking, stream, isMe, focused, onFocus }: TileProps) {
    const tileRef = useRef<HTMLDivElement>(null);
    const showVideo = (participant.video || participant.screen) && stream !== null && stream.getVideoTracks().length > 0;

    const classes = ["call-tile"];
    if (speaking && !participant.muted) classes.push("speaking");
    if (showVideo) classes.push("with-video");

    return (
        <div ref={tileRef} className={classes.join(" ")} onClick={onFocus} title={focused ? "Réduire" : "Agrandir"}>
            {showVideo
                ? <Video stream={stream} mirrored={isMe && !participant.screen} />
                : <Avatar user={participant.user} size={80} />}
            <span className="call-tile-name">
                {participant.screen && "🖥️ "}
                {participant.user.displayName}
                {participant.deafened ? " 🙉" : participant.muted ? " 🔇" : ""}
            </span>
            {showVideo && (
                <button
                    className="call-tile-fullscreen"
                    title="Plein écran"
                    onClick={(e) => {
                        e.stopPropagation();
                        void tileRef.current?.requestFullscreen?.();
                    }}
                >
                    ⛶
                </button>
            )}
        </div>
    );
}

/**
 * Les participants d'un appel : vidéo si la caméra (ou l'écran) est partagée,
 * sinon un grand avatar qui s'illumine quand la personne parle.
 * Cliquer sur une tuile l'agrandit.
 */
export default function CallTiles({ participants }: { participants: CallParticipant[] }) {
    const { speaking, streamOf } = useCalls();
    const { user } = useAuth();
    const [focusedId, setFocusedId] = useState<number | null>(null);

    const focused = participants.some((p) => p.user.id === focusedId) ? focusedId : null;
    const tiles = orderTiles(participants.map((p) => ({ ...p, userId: p.user.id })), focused);

    const renderTile = (tile: (typeof tiles)[number]) => (
        <Tile
            key={tile.userId}
            participant={tile}
            speaking={speaking.has(tile.userId)}
            stream={streamOf(tile.userId)}
            isMe={tile.userId === user?.id}
            focused={tile.userId === focused}
            onFocus={() => setFocusedId(tile.userId === focused ? null : tile.userId)}
        />
    );

    if (focused !== null) {
        return (
            <div className="call-focus">
                <div className="call-focus-main">{renderTile(tiles[0])}</div>
                {tiles.length > 1 && <div className="call-focus-strip">{tiles.slice(1).map(renderTile)}</div>}
            </div>
        );
    }

    return (
        <div className="call-tiles" style={{ gridTemplateColumns: `repeat(${gridColumns(tiles.length)}, minmax(0, 1fr))` }}>
            {tiles.map(renderTile)}
        </div>
    );
}
