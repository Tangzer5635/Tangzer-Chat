import { useCalls } from "../../context/calls";

/** Micro, casque, caméra, partage d'écran, raccrocher. */
export default function CallControls({ large = false }: { large?: boolean }) {
    const {
        muted, deafened, video, screen, screenShareSupported,
        toggleMute, toggleDeafen, toggleCamera, toggleScreen, leave,
    } = useCalls();
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
            <button
                className={video ? `${size} on` : size}
                onClick={() => void toggleCamera()}
                title={video ? "Éteindre la caméra" : "Allumer la caméra"}
                aria-pressed={video}
            >
                📷
            </button>
            {screenShareSupported && (
                <button
                    className={screen ? `${size} on` : size}
                    onClick={() => void toggleScreen()}
                    title={screen ? "Arrêter le partage d'écran" : "Partager mon écran"}
                    aria-pressed={screen}
                >
                    🖥️
                </button>
            )}
            <button className={`${size} hang-up`} onClick={leave} title="Raccrocher">
                <span>📞</span>
            </button>
        </div>
    );
}
