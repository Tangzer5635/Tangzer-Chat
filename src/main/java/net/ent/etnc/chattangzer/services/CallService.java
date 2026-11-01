package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.CallDtos;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Appels audio/vidéo, en mémoire : qui est dans quel appel.
 *
 * Le serveur ne transporte jamais le son ni l'image : les navigateurs se
 * connectent directement entre eux (WebRTC, « maillage » : chacun avec chacun).
 * Le serveur sert seulement à se trouver (signalisation) :
 *   1. le nouveau venu reçoit la liste des participants (CALL_JOINED) ;
 *   2. il envoie une offre à chacun, qui répond ; les candidats réseau suivent ;
 *   3. tout le monde voit l'état de l'appel (CALL_STATE).
 *
 * Un utilisateur n'est que dans un seul appel à la fois.
 */
@Service
public class CallService {

    /** Un appel en cours dans un salon vocal ou une conversation privée. */
    private static final class Room {
        final Long channelId;
        final Long serverId;
        /** Pour un MP : les deux participants (à prévenir de l'état de l'appel). */
        final List<UserDto> dmUsers;
        final Map<Long, Member> members = new LinkedHashMap<>();

        Room(Long channelId, Long serverId, List<UserDto> dmUsers) {
            this.channelId = channelId;
            this.serverId = serverId;
            this.dmUsers = dmUsers;
        }
    }

    private static final class Member {
        final UserDto user;
        final String clientId;
        final String sessionId;
        boolean muted;
        boolean deafened;
        boolean video;
        boolean screen;

        Member(UserDto user, String clientId, String sessionId) {
            this.user = user;
            this.clientId = clientId;
            this.sessionId = sessionId;
        }
    }

    private final Map<Long, Room> rooms = new LinkedHashMap<>();
    private final Map<Long, Long> roomOfUser = new LinkedHashMap<>();

    private final AccessService accessService;
    private final UserRepository userRepository;
    private final RealtimeService realtime;

    public CallService(AccessService accessService, UserRepository userRepository, RealtimeService realtime) {
        this.accessService = accessService;
        this.userRepository = userRepository;
        this.realtime = realtime;
    }

    // ------------------------------------------------------------- Rejoindre

    /** Entre dans l'appel du salon (le crée s'il n'existe pas) ; quitte l'appel précédent si besoin. */
    @Transactional(readOnly = true)
    public synchronized CallDtos.CallState join(Long channelId, Long userId, String clientId, String sessionId) {
        Channel channel = accessService.requireChannel(channelId, userId);
        if (channel.getType() == ChannelType.TEXT) {
            throw ApiException.badRequest("Les appels se passent dans un salon vocal ou en message privé");
        }
        if (clientId == null || clientId.isBlank()) {
            throw ApiException.badRequest("Identifiant d'onglet manquant");
        }

        leave(userId);

        UserDto user = UserDto.from(userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable")));
        Room room = rooms.computeIfAbsent(channelId, id -> newRoom(channel));
        boolean startsTheCall = room.members.isEmpty();
        room.members.put(userId, new Member(user, clientId, sessionId));
        roomOfUser.put(userId, channelId);

        broadcast(room);

        // En MP, celui qui lance l'appel fait sonner l'autre.
        if (startsTheCall && !room.dmUsers.isEmpty()) {
            room.dmUsers.stream()
                    .filter(other -> !other.id().equals(userId))
                    .forEach(other -> realtime.toUser(other.username(), "INCOMING_CALL",
                            new CallDtos.IncomingCall(channelId, user)));
        }
        return toState(room);
    }

    private Room newRoom(Channel channel) {
        List<UserDto> dmUsers = channel.isDirect()
                ? List.of(UserDto.from(channel.getDmUser1()), UserDto.from(channel.getDmUser2()))
                : List.of();
        return new Room(channel.getId(), channel.getServer() == null ? null : channel.getServer().getId(), dmUsers);
    }

    // --------------------------------------------------------------- Quitter

    public synchronized void leave(Long userId) {
        Long channelId = roomOfUser.remove(userId);
        if (channelId == null) {
            return;
        }
        Room room = rooms.get(channelId);
        room.members.remove(userId);
        if (room.members.isEmpty()) {
            rooms.remove(channelId);
        }
        broadcast(room);
    }

    /** Onglet fermé ou connexion perdue : on sort de l'appel ouvert depuis cette connexion. */
    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        leaveSession(event.getSessionId());
    }

    synchronized void leaveSession(String sessionId) {
        roomOfUser.keySet().stream()
                .filter(userId -> {
                    Member member = rooms.get(roomOfUser.get(userId)).members.get(userId);
                    return member != null && sessionId.equals(member.sessionId);
                })
                .findFirst()
                .ifPresent(this::leave);
    }

    // --------------------------------------------------------------- Pendant l'appel

    public synchronized void updateState(Long userId, CallDtos.StateRequest request) {
        memberOf(userId).ifPresent(member -> {
            member.muted = request.muted();
            member.deafened = request.deafened();
            member.video = request.video();
            member.screen = request.screen();
            broadcast(rooms.get(roomOfUser.get(userId)));
        });
    }

    /** Relaie un message WebRTC, uniquement entre deux participants du même appel. */
    public synchronized void relay(Long fromUserId, CallDtos.SignalRequest request) {
        Long channelId = roomOfUser.get(fromUserId);
        if (channelId == null || !channelId.equals(request.channelId())
                || !channelId.equals(roomOfUser.get(request.toUserId()))) {
            throw ApiException.forbidden("Ce participant n'est pas dans ton appel");
        }
        if (!Set.of("offer", "answer", "candidate").contains(request.type())) {
            throw ApiException.badRequest("Message d'appel inconnu");
        }
        Member target = rooms.get(channelId).members.get(request.toUserId());
        realtime.toUserCalls(target.user.username(), "CALL_SIGNAL", new CallDtos.Signal(
                channelId, fromUserId, target.clientId, request.type(), request.data()));
    }

    /** Refuser un appel privé : celui qui appelle est prévenu. */
    @Transactional(readOnly = true)
    public synchronized void decline(Long channelId, Long userId) {
        Channel channel = accessService.requireChannel(channelId, userId);
        Room room = rooms.get(channelId);
        if (room == null || !channel.isDirect()) {
            return;
        }
        UserDto by = UserDto.from(userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable")));
        room.members.values().forEach(member ->
                realtime.toUser(member.user.username(), "CALL_DECLINED", new CallDtos.Declined(channelId, by)));
    }

    // --------------------------------------------------------------- Lecture

    /** Les appels en cours que je peux voir : salons vocaux de mes serveurs et mes MP. */
    @Transactional(readOnly = true)
    public synchronized List<CallDtos.CallState> visibleCalls(Long userId) {
        List<CallDtos.CallState> visible = new ArrayList<>();
        for (Room room : rooms.values()) {
            boolean canSee = room.serverId != null
                    ? accessService.isMember(room.serverId, userId)
                    : room.dmUsers.stream().anyMatch(u -> u.id().equals(userId));
            if (canSee) {
                visible.add(toState(room));
            }
        }
        return visible;
    }

    public synchronized Optional<Long> callOf(Long userId) {
        return Optional.ofNullable(roomOfUser.get(userId));
    }

    // --------------------------------------------------------------- Outils

    private Optional<Member> memberOf(Long userId) {
        Long channelId = roomOfUser.get(userId);
        return channelId == null ? Optional.empty() : Optional.ofNullable(rooms.get(channelId).members.get(userId));
    }

    /** Salon vocal : tout le serveur voit qui est dedans. MP : les deux participants. */
    private void broadcast(Room room) {
        CallDtos.CallState state = toState(room);
        if (room.serverId != null) {
            realtime.toServer(room.serverId, "CALL_STATE", state);
        } else {
            room.dmUsers.forEach(user -> realtime.toUser(user.username(), "CALL_STATE", state));
        }
    }

    private static CallDtos.CallState toState(Room room) {
        List<CallDtos.Participant> participants = room.members.values().stream()
                .map(m -> new CallDtos.Participant(m.user, m.clientId, m.muted, m.deafened, m.video, m.screen))
                .toList();
        return new CallDtos.CallState(room.channelId, room.serverId, participants);
    }
}
