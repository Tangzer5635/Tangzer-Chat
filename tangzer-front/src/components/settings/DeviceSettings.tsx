import { useEffect, useRef, useState } from "react";

import { rms } from "../../calls/callsState";
import { playMessageSound } from "../../calls/audio";
import { deviceConstraint, loadDevicePrefs, saveDevicePrefs, type DevicePrefs } from "../../lib/devicePrefs";
import { APP_NAME } from "../../lib/brand";

/** Notifications du bureau et sons : réglages de cet appareil. */
export function NotificationSettings() {
    const [prefs, setPrefs] = useState<DevicePrefs>(loadDevicePrefs);
    const supported = "Notification" in window;

    const update = (change: Partial<DevicePrefs>) => {
        const next = { ...prefs, ...change };
        setPrefs(next);
        saveDevicePrefs(next);
    };

    const toggleDesktop = async (enabled: boolean) => {
        if (enabled && supported && Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                return;
            }
        }
        update({ desktopNotifications: enabled });
    };

    return (
        <div className="form">
            <label className="switch">
                <input
                    type="checkbox"
                    checked={prefs.desktopNotifications}
                    disabled={!supported}
                    onChange={(e) => void toggleDesktop(e.target.checked)}
                />
                <span>
                    <strong>Notifications du bureau</strong>
                    <small>
                        {supported
                            ? `Une notification système pour les messages privés et les mentions quand ${APP_NAME} n'est pas affiché.`
                            : "Ton navigateur ne gère pas les notifications (ou la page n'est pas en HTTPS)."}
                    </small>
                </span>
            </label>

            <label className="switch">
                <input type="checkbox" checked={prefs.sounds} onChange={(e) => update({ sounds: e.target.checked })} />
                <span>
                    <strong>Sons</strong>
                    <small>Un petit « ding » pour les messages privés et les mentions.</small>
                </span>
            </label>

            <div className="settings-actions">
                <button className="button-secondary" onClick={() => playMessageSound()}>Écouter le son</button>
            </div>
            <p className="form-hint">En « Ne pas déranger », aucune notification ni sonnerie.</p>
        </div>
    );
}

/** Choix du micro et de la caméra, avec un test du micro et un aperçu de la caméra. */
export function VoiceSettings() {
    const [prefs, setPrefs] = useState<DevicePrefs>(loadDevicePrefs);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [testing, setTesting] = useState(false);
    const [level, setLevel] = useState(0);
    const [previewing, setPreviewing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const available = window.isSecureContext && !!navigator.mediaDevices?.enumerateDevices;

    const update = (change: Partial<DevicePrefs>) => {
        const next = { ...prefs, ...change };
        setPrefs(next);
        saveDevicePrefs(next);
    };

    // La liste n'a de vrais noms qu'une fois l'accès autorisé : on la recharge après chaque test.
    const refreshDevices = () => {
        navigator.mediaDevices.enumerateDevices().then(setDevices).catch(() => setDevices([]));
    };

    useEffect(() => {
        if (available) {
            refreshDevices();
        }
    }, [available]);

    // Test du micro : une jauge suit le volume.
    useEffect(() => {
        if (!testing) {
            return;
        }
        let stream: MediaStream | null = null;
        let frame = 0;
        let context: AudioContext | null = null;
        navigator.mediaDevices.getUserMedia({ audio: deviceConstraint(prefs.microphoneId) })
            .then((media) => {
                stream = media;
                refreshDevices();
                context = new AudioContext();
                const analyser = context.createAnalyser();
                analyser.fftSize = 512;
                context.createMediaStreamSource(media).connect(analyser);
                const samples = new Uint8Array(512);
                const tick = () => {
                    analyser.getByteTimeDomainData(samples);
                    setLevel(Math.min(1, rms(samples) * 6));
                    frame = requestAnimationFrame(tick);
                };
                tick();
            })
            .catch(() => setTesting(false));
        return () => {
            cancelAnimationFrame(frame);
            stream?.getTracks().forEach((track) => track.stop());
            void context?.close();
            setLevel(0);
        };
    }, [testing, prefs.microphoneId]);

    // Aperçu de la caméra.
    useEffect(() => {
        if (!previewing) {
            return;
        }
        let stream: MediaStream | null = null;
        navigator.mediaDevices.getUserMedia({ video: deviceConstraint(prefs.cameraId) })
            .then((media) => {
                stream = media;
                refreshDevices();
                if (videoRef.current) {
                    videoRef.current.srcObject = media;
                }
            })
            .catch(() => setPreviewing(false));
        return () => stream?.getTracks().forEach((track) => track.stop());
    }, [previewing, prefs.cameraId]);

    if (!available) {
        return <p className="form-error">Le micro et la caméra ne sont disponibles qu'en HTTPS.</p>;
    }

    const microphones = devices.filter((d) => d.kind === "audioinput");
    const cameras = devices.filter((d) => d.kind === "videoinput");

    return (
        <div className="form">
            <label htmlFor="microphone">Micro</label>
            <select id="microphone" value={prefs.microphoneId ?? ""} onChange={(e) => update({ microphoneId: e.target.value || null })}>
                <option value="">Par défaut</option>
                {microphones.map((device, i) => (
                    <option key={device.deviceId || i} value={device.deviceId}>{device.label || `Micro ${i + 1}`}</option>
                ))}
            </select>
            <div className="settings-row">
                <button className={testing ? "button-danger" : "button-secondary"} onClick={() => setTesting((t) => !t)}>
                    {testing ? "Arrêter le test" : "Tester le micro"}
                </button>
                <div className="level-meter" aria-label="Volume du micro">
                    <span style={{ width: `${Math.round(level * 100)}%` }} />
                </div>
            </div>

            <label htmlFor="camera">Caméra</label>
            <select id="camera" value={prefs.cameraId ?? ""} onChange={(e) => update({ cameraId: e.target.value || null })}>
                <option value="">Par défaut</option>
                {cameras.map((device, i) => (
                    <option key={device.deviceId || i} value={device.deviceId}>{device.label || `Caméra ${i + 1}`}</option>
                ))}
            </select>
            <div className="settings-row">
                <button className={previewing ? "button-danger" : "button-secondary"} onClick={() => setPreviewing((p) => !p)}>
                    {previewing ? "Couper l'aperçu" : "Aperçu de la caméra"}
                </button>
            </div>
            {previewing && <video ref={videoRef} className="camera-preview" autoPlay playsInline muted />}
        </div>
    );
}
