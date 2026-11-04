import { HeadphoneOff, Headphones, Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";

import { useCalls } from "../../context/calls";

/**
 * Micro, casque, caméra, partage d'écran, raccrocher.
 * Chaque bouton bascule (aria-pressed) garde le même nom ; son état est annoncé à part.
 */
export default function CallControls({ large = false }: { large?: boolean }) {
    const {
        muted, deafened, video, screen, screenShareSupported, hasMic,
        toggleMute, toggleDeafen, toggleCamera, toggleScreen, leave,
    } = useCalls();
    const size = large ? "call-button large" : "call-button";
    const iconSize = large ? 24 : 18;

    return (
        <div className="call-controls" role="group" aria-label="Contrôles de l'appel">
            <button
                className={muted || !hasMic ? `${size} off` : size}
                onClick={toggleMute}
                disabled={!hasMic}
                title={!hasMic ? "Aucun micro : écoute seule" : muted ? "Réactiver le micro" : "Couper le micro"}
                aria-label="Couper le micro"
                aria-pressed={muted}
            >
                {muted ? <MicOff size={iconSize} /> : <Mic size={iconSize} />}
            </button>
            <button
                className={deafened ? `${size} off` : size}
                onClick={toggleDeafen}
                title={deafened ? "Réactiver le son" : "Couper le son"}
                aria-label="Couper le son"
                aria-pressed={deafened}
            >
                {deafened ? <HeadphoneOff size={iconSize} /> : <Headphones size={iconSize} />}
            </button>
            <button
                className={video ? `${size} on` : size}
                onClick={() => void toggleCamera()}
                title={video ? "Éteindre la caméra" : "Allumer la caméra"}
                aria-label="Caméra"
                aria-pressed={video}
            >
                {video ? <Video size={iconSize} /> : <VideoOff size={iconSize} />}
            </button>
            {screenShareSupported && (
                <button
                    className={screen ? `${size} on` : size}
                    onClick={() => void toggleScreen()}
                    title={screen ? "Arrêter le partage d'écran" : "Partager mon écran"}
                    aria-label="Partager mon écran"
                    aria-pressed={screen}
                >
                    <MonitorUp size={iconSize} />
                </button>
            )}
            <button className={`${size} hang-up`} onClick={leave} title="Raccrocher" aria-label="Raccrocher">
                <PhoneOff size={iconSize} />
            </button>
        </div>
    );
}
