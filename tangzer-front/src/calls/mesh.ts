import type { SignalType } from "../types/api";

/**
 * Connexions WebRTC d'un appel en « maillage » : une connexion directe avec
 * chaque autre participant. Le son ne passe jamais par le serveur.
 *
 * Qui appelle qui ? Le nouveau venu envoie une offre à chaque participant déjà
 * présent ; ceux-ci répondent. On évite ainsi que deux offres se croisent.
 */

export interface MeshCallbacks {
    /** Envoie un message de signalisation à un participant (via le serveur). */
    sendSignal: (toUserId: number, type: SignalType, data: unknown) => void;
    onRemoteStream: (userId: number, stream: MediaStream) => void;
    onPeerClosed: (userId: number) => void;
}

interface Peer {
    connection: RTCPeerConnection;
    /** Candidats réseau reçus avant la description distante : on les garde de côté. */
    pendingCandidates: RTCIceCandidateInit[];
}

export class Mesh {
    private readonly peers = new Map<number, Peer>();
    private readonly localStream: MediaStream;
    private readonly iceServers: RTCIceServer[];
    private readonly callbacks: MeshCallbacks;

    constructor(localStream: MediaStream, iceServers: RTCIceServer[], callbacks: MeshCallbacks) {
        this.localStream = localStream;
        this.iceServers = iceServers;
        this.callbacks = callbacks;
    }

    /** Je viens d'arriver : j'envoie une offre à ce participant. */
    async connectTo(userId: number) {
        const { connection } = this.peerFor(userId);
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        this.callbacks.sendSignal(userId, "offer", connection.localDescription?.toJSON());
    }

    async handleSignal(fromUserId: number, type: SignalType, data: unknown) {
        if (type === "offer") {
            const peer = this.peerFor(fromUserId);
            await peer.connection.setRemoteDescription(data as RTCSessionDescriptionInit);
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

    private peerFor(userId: number): Peer {
        const existing = this.peers.get(userId);
        if (existing) {
            return existing;
        }

        const connection = new RTCPeerConnection({ iceServers: this.iceServers });
        this.localStream.getTracks().forEach((track) => connection.addTrack(track, this.localStream));

        connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.callbacks.sendSignal(userId, "candidate", event.candidate.toJSON());
            }
        };
        connection.ontrack = (event) => {
            this.callbacks.onRemoteStream(userId, event.streams[0] ?? new MediaStream([event.track]));
        };
        connection.onconnectionstatechange = () => {
            // Coupure réseau passagère : on relance la recherche de chemin.
            if (connection.connectionState === "failed") {
                connection.restartIce();
            }
        };

        const peer: Peer = { connection, pendingCandidates: [] };
        this.peers.set(userId, peer);
        return peer;
    }

    private async flushCandidates(peer: Peer) {
        const candidates = peer.pendingCandidates.splice(0);
        for (const candidate of candidates) {
            await peer.connection.addIceCandidate(candidate).catch(() => undefined);
        }
    }
}
