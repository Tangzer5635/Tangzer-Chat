import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { fetchCalls, fetchIceServers } from "../api/calls";
import { playJoinSound, playLeaveSound, SpeakingDetector, startRingtone } from "../calls/audio";
import { applyCallState, departedPeers } from "../calls/callsState";
import { Mesh } from "../calls/mesh";
import { pickVideoTrack } from "../calls/video";
import { deviceConstraint, loadDevicePrefs } from "../lib/devicePrefs";
import { randomId } from "../lib/id";
import { useRealtimeConnected, useSubscription } from "../realtime/hooks";
import { publish } from "../realtime/stomp";
import type { CallSignal, CallState, IncomingCall, RealtimeEvent, Server } from "../types/api";
import { useAuth } from "./auth";
import { CallContext, type CallContextValue, type CurrentCall } from "./calls";
import { useServers } from "./servers";
import { useToasts } from "./toasts";

/** Identifie cet onglet auprès du serveur (on peut avoir l'application ouverte plusieurs fois). */
const CLIENT_ID = randomId();
const RING_TIMEOUT_MS = 30_000;

/** Lecture du son d'un participant. */
function RemoteAudio({ stream, muted }: { stream: MediaStream; muted: boolean }) {
    const ref = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.srcObject = stream;
        }
    }, [stream]);
    return <audio ref={ref} autoPlay muted={muted} />;
}

/** Écoute les CALL_STATE des salons vocaux d'un serveur. */
function ServerCallEvents({ server, onState }: { server: Server; onState: (state: CallState) => void }) {
    useSubscription<RealtimeEvent>(`/topic/servers/${server.id}`, (event) => {
        if (event.type === "CALL_STATE") {
            onState(event.payload as CallState);
        }
    });
    return null;
}

/**
 * Tout ce qui concerne les appels : micro, connexions WebRTC, état des appels,
 * sonnerie des appels entrants.
 */
export function CallProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { servers } = useServers();
    const { pushToast } = useToasts();
    const connected = useRealtimeConnected();

    const [calls, setCalls] = useState<Record<number, CallState>>({});
    const [current, setCurrent] = useState<CurrentCall | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [muted, setMuted] = useState(false);
    const [deafened, setDeafened] = useState(false);
    const [speaking, setSpeaking] = useState<Set<number>>(new Set());
    const [incoming, setIncoming] = useState<IncomingCall | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
    const [video, setVideo] = useState(false);
    const [screen, setScreen] = useState(false);
    const [localVideo, setLocalVideo] = useState<MediaStream | null>(null);

    const meshRef = useRef<Mesh | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const detectorRef = useRef<SpeakingDetector | null>(null);
    const iceServersRef = useRef<RTCIceServer[] | null>(null);
    const currentRef = useRef<CurrentCall | null>(null);
    /** Le serveur a confirmé notre arrivée dans l'appel. */
    const confirmedRef = useRef(false);
    const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);

    const supported = typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
    const screenShareSupported = supported && typeof navigator.mediaDevices?.getDisplayMedia === "function";

    // ------------------------------------------------------------- Fin d'appel

    /** Coupe tout localement (micro, connexions, sons). */
    const cleanUp = useCallback(() => {
        meshRef.current?.close();
        meshRef.current = null;
        detectorRef.current?.stop();
        detectorRef.current = null;
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        cameraTrackRef.current?.stop();
        cameraTrackRef.current = null;
        screenTrackRef.current?.stop();
        screenTrackRef.current = null;
        setVideo(false);
        setScreen(false);
        setLocalVideo(null);
        currentRef.current = null;
        confirmedRef.current = false;
        setCurrent(null);
        setRemoteStreams({});
        setSpeaking(new Set());
        setMuted(false);
        setDeafened(false);
    }, []);

    const leave = useCallback(() => {
        if (!currentRef.current) {
            return;
        }
        publish("/app/calls/leave");
        cleanUp();
        playLeaveSound();
    }, [cleanUp]);

    // ------------------------------------------------------------- Rejoindre

    const join = useCallback(async (channelId: number) => {
        if (!user) {
            return;
        }
        if (!supported) {
            pushToast("Les appels ont besoin du micro, donc d'une connexion HTTPS (https://…).", { tone: "error" });
            return;
        }
        if (currentRef.current?.channelId === channelId) {
            return;
        }
        if (currentRef.current) {
            cleanUp();
        }

        setConnecting(true);
        try {
            const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
            const microphone = deviceConstraint(loadDevicePrefs().microphoneId);
            // Le micro choisi dans les paramètres, sinon (débranché ?) celui par défaut.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { ...audio, ...microphone } })
                .catch(() => navigator.mediaDevices.getUserMedia({ audio }));
            iceServersRef.current ??= (await fetchIceServers()).map((server) => ({
                urls: server.urls,
                username: server.username ?? undefined,
                credential: server.credential ?? undefined,
            }));

            const detector = new SpeakingDetector(setSpeaking);
            detector.watch(user.id, stream);
            detectorRef.current = detector;
            localStreamRef.current = stream;

            meshRef.current = new Mesh(stream, iceServersRef.current, {
                sendSignal: (toUserId, type, data) => publish("/app/calls/signal", { channelId, toUserId, type, data }),
                onRemoteStream: (userId, remote) => {
                    setRemoteStreams((streams) => ({ ...streams, [userId]: remote }));
                    detectorRef.current?.watch(userId, remote);
                },
                onPeerClosed: (userId) => {
                    setRemoteStreams((streams) => {
                        const next = { ...streams };
                        delete next[userId];
                        return next;
                    });
                    detectorRef.current?.unwatch(userId);
                },
            });

            currentRef.current = { channelId, serverId: null };
            setCurrent(currentRef.current);
            setIncoming((ringing) => (ringing?.channelId === channelId ? null : ringing));
            publish(`/app/calls/${channelId}/join`, { clientId: CLIENT_ID });
            playJoinSound();
        } catch (err) {
            cleanUp();
            const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
            pushToast(denied
                ? "Accès au micro refusé : autorise-le dans ton navigateur pour appeler."
                : "Impossible d'utiliser le micro (aucun micro détecté ?).", { tone: "error" });
        } finally {
            setConnecting(false);
        }
    }, [user, supported, cleanUp, pushToast]);

    // ------------------------------------------------------------- État des appels

    const handleCallState = useCallback((state: CallState) => {
        setCalls((all) => applyCallState(all, state));

        // Un appel privé qui sonnait chez moi s'arrête si l'appelant raccroche.
        if (state.participants.length === 0) {
            setIncoming((ringing) => (ringing?.channelId === state.channelId ? null : ringing));
        }

        const mine = currentRef.current;
        if (!mine || mine.channelId !== state.channelId || !user) {
            return;
        }
        const me = state.participants.find((p) => p.user.id === user.id);
        if (confirmedRef.current && (!me || me.clientId !== CLIENT_ID)) {
            // Repris depuis un autre onglet, ou retiré par le serveur.
            cleanUp();
            pushToast("Tu as quitté l'appel (repris dans un autre onglet ?).");
            return;
        }

        const mesh = meshRef.current;
        if (mesh) {
            const others = state.participants.filter((p) => p.user.id !== user.id).map((p) => p.user.id);
            const departed = departedPeers(mesh.connectedUserIds(), others);
            departed.forEach((userId) => mesh.remove(userId));
            if (departed.length > 0) {
                playLeaveSound();
            }
        }
    }, [user, cleanUp, pushToast]);

    // Photo des appels en cours à chaque (re)connexion ; une coupure met fin à mon appel.
    useEffect(() => {
        if (!connected) {
            if (currentRef.current) {
                cleanUp();
                pushToast("Appel interrompu : connexion au serveur perdue.", { tone: "error" });
            }
            return;
        }
        fetchCalls()
            .then((list) => setCalls(Object.fromEntries(list.map((state) => [state.channelId, state]))))
            .catch(() => undefined);
    }, [connected, cleanUp, pushToast]);

    useSubscription<RealtimeEvent>("/user/queue/calls", (event) => {
        const mesh = meshRef.current;
        const mine = currentRef.current;

        if (event.type === "CALL_JOINED") {
            const state = event.payload as CallState;
            const meHere = state.participants.some((p) => p.clientId === CLIENT_ID);
            if (!meHere || !mine || mine.channelId !== state.channelId || !mesh || !user) {
                return;
            }
            confirmedRef.current = true;
            currentRef.current = { channelId: state.channelId, serverId: state.serverId };
            setCurrent(currentRef.current);
            setCalls((all) => applyCallState(all, state));
            // Je suis le nouveau venu : j'appelle chacun des participants déjà présents.
            state.participants
                .filter((p) => p.user.id !== user.id)
                .forEach((p) => void mesh.connectTo(p.user.id));
        }

        if (event.type === "CALL_SIGNAL") {
            const signal = event.payload as CallSignal;
            if (signal.toClientId === CLIENT_ID && mesh && mine?.channelId === signal.channelId) {
                void mesh.handleSignal(signal.fromUserId, signal.type, signal.data);
            }
        }
    });

    useSubscription<RealtimeEvent>("/user/queue/events", (event) => {
        if (event.type === "CALL_STATE") {
            handleCallState(event.payload as CallState);
        }
        if (event.type === "INCOMING_CALL") {
            const call = event.payload as IncomingCall;
            if (currentRef.current?.channelId !== call.channelId) {
                setIncoming(call);
            }
        }
        if (event.type === "CALL_DECLINED") {
            const { channelId, by } = event.payload as { channelId: number; by: { displayName: string } };
            pushToast(`📵 ${by.displayName} a refusé l'appel.`);
            const alone = (calls[channelId]?.participants.length ?? 1) <= 1;
            if (currentRef.current?.channelId === channelId && alone) {
                leave();
            }
        }
    });

    // ------------------------------------------------------------- Sonnerie

    const incomingChannel = incoming?.channelId;
    const silent = user?.status === "DND";
    useEffect(() => {
        if (incomingChannel === undefined) {
            return;
        }
        const stopRingtone = silent ? () => undefined : startRingtone();
        const timeout = setTimeout(() => setIncoming(null), RING_TIMEOUT_MS);
        return () => {
            stopRingtone();
            clearTimeout(timeout);
        };
    }, [incomingChannel, silent]);

    // Appel privé sans réponse au bout de 30 secondes : on raccroche.
    const currentChannel = current?.channelId;
    const aloneInPrivateCall = current !== null && current.serverId === null
        && (calls[current.channelId]?.participants.length ?? 1) <= 1;
    useEffect(() => {
        if (!aloneInPrivateCall) {
            return;
        }
        const timeout = setTimeout(() => {
            pushToast("📵 Pas de réponse.");
            leave();
        }, RING_TIMEOUT_MS);
        return () => clearTimeout(timeout);
    }, [aloneInPrivateCall, currentChannel, leave, pushToast]);

    // ------------------------------------------------------------- Micro et casque

    const publishState = (nextMuted: boolean, nextDeafened: boolean) => {
        localStreamRef.current?.getAudioTracks().forEach((track) => {
            track.enabled = !nextMuted;
        });
        publish("/app/calls/state", {
            muted: nextMuted,
            deafened: nextDeafened,
            video: cameraTrackRef.current !== null,
            screen: screenTrackRef.current !== null,
        });
    };

    // ------------------------------------------------------------- Caméra et écran

    /** Envoie la bonne image (écran sinon caméra) à tout le monde et prévient les autres. */
    const applyVideo = async () => {
        const track = pickVideoTrack(cameraTrackRef.current, screenTrackRef.current);
        await meshRef.current?.setVideoTrack(track);
        setLocalVideo(track ? new MediaStream([track]) : null);
        setVideo(cameraTrackRef.current !== null);
        setScreen(screenTrackRef.current !== null);
        publishState(muted, deafened);
    };

    const toggleCamera = async () => {
        if (!currentRef.current) {
            return;
        }
        if (cameraTrackRef.current) {
            cameraTrackRef.current.stop();
            cameraTrackRef.current = null;
        } else {
            try {
                const quality = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
                const camera = deviceConstraint(loadDevicePrefs().cameraId);
                const stream = await navigator.mediaDevices.getUserMedia({ video: { ...quality, ...camera } })
                    .catch(() => navigator.mediaDevices.getUserMedia({ video: quality }));
                cameraTrackRef.current = stream.getVideoTracks()[0];
            } catch {
                pushToast("Impossible d'allumer la caméra (accès refusé ou aucune caméra).", { tone: "error" });
                return;
            }
        }
        await applyVideo();
    };

    const stopScreen = async () => {
        screenTrackRef.current?.stop();
        screenTrackRef.current = null;
        await applyVideo();
    };

    const toggleScreen = async () => {
        if (!currentRef.current) {
            return;
        }
        if (screenTrackRef.current) {
            await stopScreen();
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15 } }, audio: false });
            const track = stream.getVideoTracks()[0];
            // « Arrêter le partage » depuis la barre du navigateur.
            track.onended = () => {
                if (screenTrackRef.current === track) {
                    void stopScreen();
                }
            };
            screenTrackRef.current = track;
        } catch {
            return; // partage annulé par l'utilisateur
        }
        await applyVideo();
    };

    const streamOf = (userId: number): MediaStream | null =>
        userId === user?.id ? localVideo : remoteStreams[userId] ?? null;

    const toggleMute = () => {
        const nextMuted = !muted;
        // Réactiver le micro réactive aussi le casque (comme Discord).
        const nextDeafened = nextMuted ? deafened : false;
        setMuted(nextMuted);
        setDeafened(nextDeafened);
        publishState(nextMuted, nextDeafened);
    };

    const toggleDeafen = () => {
        // Couper le casque coupe aussi le micro.
        const nextDeafened = !deafened;
        setDeafened(nextDeafened);
        setMuted(nextDeafened);
        publishState(nextDeafened, nextDeafened);
    };

    const acceptIncoming = () => {
        if (incoming) {
            void join(incoming.channelId);
            setIncoming(null);
        }
    };

    const declineIncoming = () => {
        if (incoming) {
            publish(`/app/calls/${incoming.channelId}/decline`);
            setIncoming(null);
        }
    };

    // Raccrocher proprement si on quitte l'application.
    useEffect(() => () => {
        if (currentRef.current) {
            publish("/app/calls/leave");
        }
        cleanUp();
    }, [cleanUp]);

    const value: CallContextValue = {
        calls, current, connecting, muted, deafened, video, screen, screenShareSupported, speaking, incoming, supported,
        join, leave, toggleMute, toggleDeafen, toggleCamera, toggleScreen, streamOf, acceptIncoming, declineIncoming,
    };

    return (
        <CallContext.Provider value={value}>
            {servers.map((server) => (
                <ServerCallEvents key={server.id} server={server} onState={handleCallState} />
            ))}
            {Object.entries(remoteStreams).map(([userId, stream]) => (
                <RemoteAudio key={userId} stream={stream} muted={deafened} />
            ))}
            {children}
        </CallContext.Provider>
    );
}
