import type { SignalType } from "../types/api";

/**
 * Connexions WebRTC d'un appel en « maillage » : une connexion directe avec
 * chaque autre participant. Le son et l'image ne passent jamais par le serveur.
 *
 * Qui appelle qui ? Le nouveau venu envoie une offre à chaque participant déjà
 * présent ; ceux-ci répondent. On évite ainsi que deux offres se croisent.
 *
 * Vidéo : chaque connexion prévoit dès le départ un canal vidéo (vide au début).
 * Allumer la caméra ou partager son écran revient à y brancher une piste
 * (replaceTrack), sans renégocier la connexion.
 */

export interface MeshCallbacks {
    /** Envoie un message de signalisation à un participant (via le serveur). */
    sendSignal: (toUserId: number, type: SignalType, data: unknown) => void;
    onRemoteStream: (userId: number, stream: MediaStream) => void;
    onPeerClosed: (userId: number) => void;
}

interface Peer {
    connection: RTCPeerConnection;
    /** C'est moi qui ai envoyé l'offre (c'est donc à moi de relancer en cas de coupure). */
    initiator: boolean;
    /** Son et image reçus de ce participant, réunis dans un seul flux. */
    remoteStream: MediaStream;
    /** Candidats réseau reçus avant la description distante : on les garde de côté. */
    pendingCandidates: RTCIceCandidateInit[];
}

export class Mesh {
    private readonly peers = new Map<number, Peer>();
    private readonly localStream: MediaStream;
    private readonly iceServers: RTCIceServer[];
    private readonly callbacks: MeshCallbacks;
    /** Piste vidéo envoyée à tout le monde (caméra ou écran), ou null. */
    private videoTrack: MediaStreamTrack | null = null;

    constructor(localStream: MediaStream, iceServers: RTCIceServer[], callbacks: MeshCallbacks) {
        this.localStream = localStream;
        this.iceServers = iceServers;
        this.callbacks = callbacks;
    }

    /** Je viens d'arriver : j'envoie une offre à ce participant. */
    async connectTo(userId: number) {
        const peer = this.createPeer(userId, true);
        const { connection } = peer;
        this.localStream.getAudioTracks().forEach((track) => connection.addTrack(track, this.localStream));
        const video = connection.addTransceiver("video", { direction: "sendrecv", streams: [this.localStream] });
        await video.sender.replaceTrack(this.videoTrack);
        await this.sendOffer(userId, peer);
    }

    async handleSignal(fromUserId: number, type: SignalType, data: unknown) {
        if (type === "offer") {
            const known = this.peers.get(fromUserId);
            const peer = known ?? this.createPeer(fromUserId, false);
            await peer.connection.setRemoteDescription(data as RTCSessionDescriptionInit);
            if (!known) {
                await this.attachLocalMedia(peer);
            }
            await this.flushCandidates(peer);
            const answer = await peer.connection.createAnswer();
            await peer.connection.setLocalDescription(answer);
            this.callbacks.sendSignal(fromUserId, "answer", peer.connection.localDescription?.toJSON());
            return;
        }

        const peer = this.peers.get(fromUserId);
        if (!peer) {
            return;
        }
        if (type === "answer") {
            await peer.connection.setRemoteDescription(data as RTCSessionDescriptionInit);
            await this.flushCandidates(peer);
        } else if (type === "candidate") {
            const candidate = data as RTCIceCandidateInit;
            if (peer.connection.remoteDescription) {
                await peer.connection.addIceCandidate(candidate).catch(() => undefined);
            } else {
                peer.pendingCandidates.push(candidate);
            }
        }
    }

    /** Branche (ou débranche avec null) la caméra ou l'écran pour tous les participants. */
    async setVideoTrack(track: MediaStreamTrack | null) {
        this.videoTrack = track;
        await Promise.all([...this.peers.values()].map((peer) => {
            const sender = this.videoSender(peer.connection);
            return sender ? sender.replaceTrack(track) : Promise.resolve();
        }));
    }

    /** Ferme la connexion avec un participant parti. */
    remove(userId: number) {
        const peer = this.peers.get(userId);
        if (peer) {
            peer.connection.close();
            this.peers.delete(userId);
            this.callbacks.onPeerClosed(userId);
        }
    }

    connectedUserIds(): number[] {
        return [...this.peers.keys()];
    }

    close() {
        [...this.peers.keys()].forEach((userId) => this.remove(userId));
    }

    // ------------------------------------------------------------------ Outils

    private createPeer(userId: number, initiator: boolean): Peer {
        const connection = new RTCPeerConnection({ iceServers: this.iceServers });
        const peer: Peer = { connection, initiator, remoteStream: new MediaStream(), pendingCandidates: [] };

        connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.callbacks.sendSignal(userId, "candidate", event.candidate.toJSON());
            }
        };
        connection.ontrack = (event) => {
            if (!peer.remoteStream.getTracks().includes(event.track)) {
                peer.remoteStream.addTrack(event.track);
            }
            this.callbacks.onRemoteStream(userId, peer.remoteStream);
        };
        connection.onconnectionstatechange = () => {
            // Coupure réseau : celui qui a fait l'offre relance la recherche de chemin.
            if (connection.connectionState === "failed" && peer.initiator) {
                void this.sendOffer(userId, peer, true);
            }
        };

        this.peers.set(userId, peer);
        return peer;
    }

    /** Côté réponse : on branche mon micro et ma vidéo sur les canaux proposés par l'offre. */
    private async attachLocalMedia(peer: Peer) {
        const audio = this.localStream.getAudioTracks()[0] ?? null;
        for (const transceiver of peer.connection.getTransceivers()) {
            const kind = transceiver.receiver.track.kind;
            transceiver.direction = "sendrecv";
            transceiver.sender.setStreams?.(this.localStream);
            await transceiver.sender.replaceTrack(kind === "audio" ? audio : this.videoTrack);
        }
    }

    private async sendOffer(userId: number, peer: Peer, iceRestart = false) {
        const offer = await peer.connection.createOffer({ iceRestart });
        await peer.connection.setLocalDescription(offer);
        this.callbacks.sendSignal(userId, "offer", peer.connection.localDescription?.toJSON());
    }

    private videoSender(connection: RTCPeerConnection): RTCRtpSender | undefined {
        return connection.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender;
    }

    private async flushCandidates(peer: Peer) {
        const candidates = peer.pendingCandidates.splice(0);
        for (const candidate of candidates) {
            await peer.connection.addIceCandidate(candidate).catch(() => undefined);
        }
    }
}
