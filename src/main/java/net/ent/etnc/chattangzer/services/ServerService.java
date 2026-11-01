package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ChannelDto;
import net.ent.etnc.chattangzer.models.dtos.DiscoverServerDto;
import net.ent.etnc.chattangzer.models.dtos.MemberDto;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import net.ent.etnc.chattangzer.models.entities.MemberRole;
import net.ent.etnc.chattangzer.models.entities.Membership;
import net.ent.etnc.chattangzer.models.entities.Server;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.ChannelRepository;
import net.ent.etnc.chattangzer.repositories.InviteRepository;
import net.ent.etnc.chattangzer.repositories.MembershipRepository;
import net.ent.etnc.chattangzer.repositories.ServerRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

/**
 * Serveurs et membres : création, modification, adhésion, rôles.
 */
@Service
@Transactional
public class ServerService {

    /** Couleurs proposées pour l'icône d'un serveur. */
    public static final List<String> COLORS = List.of(
            "#5865f2", "#eb459e", "#3ba55c", "#faa61a", "#ed4245",
            "#9b59b6", "#1abc9c", "#e67e22", "#3498db", "#e91e63");

    static final String DEFAULT_SERVER_NAME = "Tangzer";
    static final List<String> DEFAULT_SERVER_CHANNELS =
            List.of("général", "dev", "wb47", "groupe-fond-à-droite(gauche)🤭😜");

    private static final Pattern COLOR_PATTERN = Pattern.compile("^#[0-9a-fA-F]{6}$");

    private final ServerRepository serverRepository;
    private final MembershipRepository membershipRepository;
    private final ChannelRepository channelRepository;
    private final InviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final AccessService accessService;
    private final RealtimeService realtime;

    public ServerService(
            ServerRepository serverRepository,
            MembershipRepository membershipRepository,
            ChannelRepository channelRepository,
            InviteRepository inviteRepository,
            UserRepository userRepository,
            AccessService accessService,
            RealtimeService realtime
    ) {
        this.serverRepository = serverRepository;
        this.membershipRepository = membershipRepository;
        this.channelRepository = channelRepository;
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.realtime = realtime;
    }

    // ------------------------------------------------------------------ Lecture

    @Transactional(readOnly = true)
    public List<ServerDto> listForUser(Long userId) {
        return membershipRepository.findAllWithServerByUserId(userId).stream()
                .map(m -> toDto(m.getServer(), m.getRole()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ServerDto get(Long serverId, Long userId) {
        Membership membership = accessService.requireMembership(serverId, userId);
        return toDto(membership.getServer(), membership.getRole());
    }

    @Transactional(readOnly = true)
    public List<DiscoverServerDto> discover(String rawQuery, Long userId) {
        String query = Texts.clean(rawQuery).toLowerCase(Locale.ROOT);
        return serverRepository.searchPublic(query).stream()
                .map(server -> toDiscoverDto(server, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MemberDto> listMembers(Long serverId, Long userId) {
        accessService.requireMembership(serverId, userId);
        return membershipRepository.findAllWithUserByServerId(serverId).stream()
                .map(MemberDto::from)
                .toList();
    }

    // ----------------------------------------------------- Création / gestion

    public ServerDto create(Long ownerId, ServerRequest request) {
        User owner = getUser(ownerId);

        Server server = new Server(
                Texts.required(request.name(), 2, 50, "Le nom du serveur"),
                normalizeColor(request.color()),
                owner);
        server.setDescription(Texts.optional(request.description(), 300, "La description"));
        server.setIcon(normalizeIcon(request.icon()));
        server.setPublicServer(Boolean.TRUE.equals(request.isPublic()));
        serverRepository.save(server);

        membershipRepository.save(new Membership(server, owner, MemberRole.OWNER));
        channelRepository.save(new Channel(server, "général", ChannelType.TEXT, 0));

        ServerDto dto = toDto(server, MemberRole.OWNER);
        // Les autres onglets du créateur ajoutent le serveur à leur liste.
        realtime.toUser(owner.getUsername(), "SERVER_JOINED", dto);
        return dto;
    }

    public ServerDto update(Long serverId, Long userId, ServerRequest request) {
        Membership membership = accessService.requireManager(serverId, userId);
        Server server = membership.getServer();

        if (request.name() != null) {
            server.setName(Texts.required(request.name(), 2, 50, "Le nom du serveur"));
        }
        if (request.description() != null) {
            server.setDescription(Texts.optional(request.description(), 300, "La description"));
        }
        if (request.icon() != null) {
            server.setIcon(normalizeIcon(request.icon()));
        }
        if (request.color() != null) {
            server.setColor(normalizeColor(request.color()));
        }
        if (request.isPublic() != null) {
            server.setPublicServer(request.isPublic());
        }

        realtime.toServer(serverId, "SERVER_UPDATED", toDto(server, null));
        return toDto(server, membership.getRole());
    }

    public void delete(Long serverId, Long userId) {
        Membership membership = accessService.requireMembership(serverId, userId);
        if (membership.getRole() != MemberRole.OWNER) {
            throw ApiException.forbidden("Seul le propriétaire peut supprimer le serveur");
        }
        if (membership.getServer().isDefaultServer()) {
            throw ApiException.badRequest("Le serveur principal de Tangzer ne peut pas être supprimé");
        }

        // On supprime d'abord tout ce qui dépend du serveur.
        inviteRepository.deleteAllByServerId(serverId);
        channelRepository.deleteAllByServerId(serverId);
        membershipRepository.deleteAllByServerId(serverId);
        serverRepository.delete(membership.getServer());
        realtime.toServer(serverId, "SERVER_DELETED", Map.of("serverId", serverId));
    }

    // ------------------------------------------------------------------ Membres

    /** Rejoindre un serveur public depuis la page Explorer. */
    public ServerDto join(Long serverId, Long userId) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> ApiException.notFound("Serveur introuvable"));
        if (!server.isPublicServer()) {
            throw ApiException.forbidden("Ce serveur est privé : il faut une invitation pour le rejoindre");
        }
        return addMember(server, getUser(userId));
    }

    /** Ajoute un membre (sans effet s'il l'est déjà) et prévient tout le monde. */
    ServerDto addMember(Server server, User user) {
        var existing = membershipRepository.findByServerIdAndUserId(server.getId(), user.getId());
        if (existing.isPresent()) {
            return toDto(server, existing.get().getRole());
        }

        Membership membership = membershipRepository.save(new Membership(server, user, MemberRole.MEMBER));
        ServerDto dto = toDto(server, MemberRole.MEMBER);

        realtime.toServer(server.getId(), "MEMBER_JOINED", MemberDto.from(membership));
        realtime.toUser(user.getUsername(), "SERVER_JOINED", dto);
        return dto;
    }

    public void leave(Long serverId, Long userId) {
        Membership membership = accessService.requireMembership(serverId, userId);
        if (membership.getRole() == MemberRole.OWNER) {
            throw ApiException.badRequest("Le propriétaire ne peut pas quitter son serveur, il peut seulement le supprimer");
        }
        removeMember(membership, "LEFT");
    }

    public void kick(Long serverId, Long actorId, Long targetId) {
        Membership actor = accessService.requireManager(serverId, actorId);
        Membership target = membershipRepository.findByServerIdAndUserId(serverId, targetId)
                .orElseThrow(() -> ApiException.notFound("Ce membre n'est pas sur le serveur"));

        if (actorId.equals(targetId)) {
            throw ApiException.badRequest("Utilise « Quitter le serveur » pour partir");
        }
        if (target.getRole() == MemberRole.OWNER
                || (actor.getRole() == MemberRole.ADMIN && target.getRole() == MemberRole.ADMIN)) {
            throw ApiException.forbidden("Tu ne peux pas expulser ce membre");
        }
        removeMember(target, "KICKED");
    }

    public MemberDto changeRole(Long serverId, Long actorId, Long targetId, MemberRole role) {
        Membership actor = accessService.requireMembership(serverId, actorId);
        if (actor.getRole() != MemberRole.OWNER) {
            throw ApiException.forbidden("Seul le propriétaire peut changer les rôles");
        }
        if (role != MemberRole.ADMIN && role != MemberRole.MEMBER) {
            throw ApiException.badRequest("Rôle invalide");
        }
        Membership target = membershipRepository.findByServerIdAndUserId(serverId, targetId)
                .orElseThrow(() -> ApiException.notFound("Ce membre n'est pas sur le serveur"));
        if (target.getRole() == MemberRole.OWNER) {
            throw ApiException.badRequest("Le rôle du propriétaire ne peut pas changer");
        }

        target.setRole(role);
        MemberDto dto = MemberDto.from(target);
        realtime.toServer(serverId, "MEMBER_UPDATED", dto);
        return dto;
    }

    private void removeMember(Membership membership, String reason) {
        Long serverId = membership.getServer().getId();
        User user = membership.getUser();

        membershipRepository.delete(membership);

        realtime.toServer(serverId, "MEMBER_LEFT", Map.of("serverId", serverId, "userId", user.getId()));
        realtime.toUser(user.getUsername(), "SERVER_REMOVED", Map.of("serverId", serverId, "reason", reason));
    }

    // ------------------------------------------------------- Serveur par défaut

    /**
     * Chaque nouvel inscrit rejoint le serveur public « Tangzer ».
     * S'il n'existe pas encore, le premier inscrit le crée et en devient propriétaire.
     */
    public void joinDefaultServer(User user) {
        serverRepository.findFirstByDefaultServerTrue().ifPresentOrElse(
                server -> addMember(server, user),
                () -> createDefaultServer(user));
    }

    private void createDefaultServer(User owner) {
        Server server = new Server(DEFAULT_SERVER_NAME, "#5865f2", owner);
        server.setIcon("⚡");
        server.setDescription("Le serveur public de Tangzer : tout le monde est le bienvenu !");
        server.setPublicServer(true);
        server.setDefaultServer(true);
        serverRepository.save(server);

        membershipRepository.save(new Membership(server, owner, MemberRole.OWNER));
        for (int i = 0; i < DEFAULT_SERVER_CHANNELS.size(); i++) {
            channelRepository.save(new Channel(server, DEFAULT_SERVER_CHANNELS.get(i), ChannelType.TEXT, i));
        }
    }

    // ------------------------------------------------------------------ Outils

    ServerDto toDto(Server server, MemberRole myRole) {
        List<ChannelDto> channels = channelRepository.findAllByServerIdOrderByPositionAscIdAsc(server.getId())
                .stream().map(ChannelDto::from).toList();
        return new ServerDto(
                server.getId(),
                server.getName(),
                server.getDescription(),
                server.getIcon(),
                server.getColor(),
                server.isPublicServer(),
                server.isDefaultServer(),
                server.getOwner().getId(),
                membershipRepository.countByServerId(server.getId()),
                myRole,
                channels);
    }

    DiscoverServerDto toDiscoverDto(Server server, Long userId) {
        return new DiscoverServerDto(
                server.getId(),
                server.getName(),
                server.getDescription(),
                server.getIcon(),
                server.getColor(),
                membershipRepository.countByServerId(server.getId()),
                accessService.isMember(server.getId(), userId));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }

    /** Couleur hexadécimale #rrggbb ; une couleur au hasard si rien n'est fourni. */
    static String normalizeColor(String raw) {
        if (raw == null || raw.isBlank()) {
            return COLORS.get(ThreadLocalRandom.current().nextInt(COLORS.size()));
        }
        String color = raw.strip();
        if (!COLOR_PATTERN.matcher(color).matches()) {
            throw ApiException.badRequest("La couleur doit être au format #rrggbb");
        }
        return color.toLowerCase(Locale.ROOT);
    }

    /** Emoji d'icône : chaîne vide = retour aux initiales. */
    static String normalizeIcon(String raw) {
        String icon = Texts.clean(raw);
        if (icon.isEmpty()) {
            return null;
        }
        if (icon.length() > 16) {
            throw ApiException.badRequest("L'icône doit être un emoji");
        }
        return icon;
    }
}
