package net.ent.etnc.chattangzer.models.dtos;

import java.util.List;

/** Données échangées pour les appels audio/vidéo. */
public final class CallDtos {

    private CallDtos() {
    }

    /** Un participant d'un appel et l'état de ses micro/casque/caméra. */
    public record Participant(
            UserDto user,
            String clientId,
            boolean muted,
            boolean deafened,
            boolean video,
            boolean screen
    ) {}

    /** Qui est dans l'appel d'un salon vocal (serverId) ou d'une conversation privée (serverId null). */
    public record CallState(Long channelId, Long serverId, List<Participant> participants) {}

    /** Rejoindre : clientId identifie l'onglet (un utilisateur peut en avoir plusieurs). */
    public record JoinRequest(String clientId) {}

    public record StateRequest(boolean muted, boolean deafened, boolean video, boolean screen) {}

    /** Message WebRTC (offer, answer, candidate) à transmettre à un autre participant. */
    public record SignalRequest(Long channelId, Long toUserId, String type, Object data) {}

    /** Ce que reçoit le destinataire d'un message WebRTC. */
    public record Signal(Long channelId, Long fromUserId, String toClientId, String type, Object data) {}

    public record IncomingCall(Long channelId, UserDto caller) {}

    public record Declined(Long channelId, UserDto by) {}

    /** Serveurs STUN/TURN que le navigateur utilise pour établir la connexion. */
    public record IceServer(List<String> urls, String username, String credential) {}
}
