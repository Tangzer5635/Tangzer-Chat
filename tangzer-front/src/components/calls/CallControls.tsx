import { useCalls } from "../../context/calls";

/** Micro, casque, raccrocher. */
export default function CallControls({ large = false }: { large?: boolean }) {
    const { muted, deafened, toggleMute, toggleDeafen, leave } = useCalls();
    const size = large ? "call-button large" : "call-button";

    return (
        <div className="call-controls">
            <button
                className={muted ? `${size} off` : size}
                onClick={toggleMute}
                title={muted ? "Réactiver le micro" : "Couper le micro"}
                aria-pressed={muted}
            >
                {muted ? "🔇" : "🎤"}
            </button>
            <button
                className={deafened ? `${size} off` : size}
                onClick={toggleDeafen}
                title={deafened ? "Réactiver le son" : "Couper le son"}
                aria-pressed={deafened}
            >
                {deafened ? "🙉" : "🎧"}
            </button>
            <button className={`${size} hang-up`} onClick={leave} title="Raccrocher">
                <span>📞</span>
            </button>
        </div>
    );
}
