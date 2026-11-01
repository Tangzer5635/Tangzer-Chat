package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.InviteDto;
import net.ent.etnc.chattangzer.models.dtos.InvitePreviewDto;
import net.ent.etnc.chattangzer.models.dtos.InviteRequest;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.Invite;
import net.ent.etnc.chattangzer.models.entities.Membership;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.InviteRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

/**
 * Liens d'invitation : n'importe quel membre peut en créer,
 * avec une durée de validité et un nombre d'utilisations facultatifs.
 */
@Service
@Transactional
public class InviteService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final int CODE_LENGTH = 8;
    public static final int MAX_AGE_HOURS = 24 * 30;
    public static final int MAX_USES = 1000;

    private final SecureRandom random = new SecureRandom();

    private final InviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final AccessService accessService;
    private final ServerService serverService;

    public InviteService(
            InviteRepository inviteRepository,
            UserRepository userRepository,
            AccessService accessService,
            ServerService serverService
    ) {
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.serverService = serverService;
    }

    public InviteDto create(Long serverId, Long userId, InviteRequest request) {
        Membership membership = accessService.requireMembership(serverId, userId);

        Integer maxAgeHours = request == null ? null : request.maxAgeHours();
        Integer maxUses = request == null ? null : request.maxUses();

        if (maxAgeHours != null && (maxAgeHours < 1 || maxAgeHours > MAX_AGE_HOURS)) {
            throw ApiException.badRequest("La durée d'une invitation va de 1 heure à 30 jours");
        }
        if (maxUses != null && (maxUses < 1 || maxUses > MAX_USES)) {
            throw ApiException.badRequest("Le nombre d'utilisations va de 1 à " + MAX_USES);
        }

        Instant expiresAt = maxAgeHours == null ? null : Instant.now().plus(Duration.ofHours(maxAgeHours));
        Invite invite = new Invite(newCode(), membership.getServer(), membership.getUser(), expiresAt, maxUses);
        return InviteDto.from(inviteRepository.save(invite));
    }

    @Transactional(readOnly = true)
    public InvitePreviewDto preview(String code, Long userId) {
        Invite invite = getInvite(code);
        return new InvitePreviewDto(
                invite.getCode(),
                serverService.toDiscoverDto(invite.getServer(), userId),
                UserDto.from(invite.getCreatedBy()),
                invite.getExpiresAt(),
                invite.isUsableAt(Instant.now()));
    }

    public ServerDto accept(String code, Long userId) {
        Invite invite = getInvite(code);

        // Déjà membre : on ouvre simplement le serveur, sans consommer l'invitation.
        if (accessService.isMember(invite.getServer().getId(), userId)) {
            return serverService.get(invite.getServer().getId(), userId);
        }
        if (!invite.isUsableAt(Instant.now())) {
            throw new ApiException(HttpStatus.GONE, "Cette invitation a expiré ou n'est plus valide");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));

        invite.setUses(invite.getUses() + 1);
        return serverService.addMember(invite.getServer(), user);
    }

    private Invite getInvite(String code) {
        return inviteRepository.findById(code == null ? "" : code.strip())
                .orElseThrow(() -> ApiException.notFound("Cette invitation n'existe pas"));
    }

    /** Code de 8 caractères sans caractères ambigus (0/O, 1/l/I). */
    private String newCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                builder.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            code = builder.toString();
        } while (inviteRepository.existsById(code));
        return code;
    }
}
