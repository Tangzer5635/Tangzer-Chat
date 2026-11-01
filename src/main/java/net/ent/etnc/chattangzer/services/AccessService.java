package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.entities.Channel;
import net.ent.etnc.chattangzer.models.entities.Membership;
import net.ent.etnc.chattangzer.repositories.ChannelRepository;
import net.ent.etnc.chattangzer.repositories.MembershipRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Répond à la question « cet utilisateur a-t-il le droit de voir ça ? ».
 *
 * Utilisé par les services REST et par le garde des abonnements STOMP.
 * Ne dépend que des repositories, pour pouvoir être injecté dans la
 * configuration WebSocket sans dépendance circulaire.
 */
@Service
@Transactional(readOnly = true)
public class AccessService {

    private final MembershipRepository membershipRepository;
    private final ChannelRepository channelRepository;

    public AccessService(MembershipRepository membershipRepository, ChannelRepository channelRepository) {
        this.membershipRepository = membershipRepository;
        this.channelRepository = channelRepository;
    }

    public boolean isMember(Long serverId, Long userId) {
        return membershipRepository.existsByServerIdAndUserId(serverId, userId);
    }

    public boolean canAccessChannel(Long channelId, Long userId) {
        return channelRepository.findById(channelId)
                .map(channel -> canAccess(channel, userId))
                .orElse(false);
    }

    /** Salon de serveur : il faut être membre. Conversation privée : il faut en être l'un des deux participants. */
    public boolean canAccess(Channel channel, Long userId) {
        return channel.isDirect()
                ? channel.isParticipant(userId)
                : isMember(channel.getServer().getId(), userId);
    }

    /** Membre du serveur, sinon 403 (ou 404 si le serveur n'existe pas). */
    public Membership requireMembership(Long serverId, Long userId) {
        return membershipRepository.findByServerIdAndUserId(serverId, userId)
                .orElseThrow(() -> ApiException.forbidden("Tu n'es pas membre de ce serveur"));
    }

    /** Propriétaire ou admin du serveur. */
    public Membership requireManager(Long serverId, Long userId) {
        Membership membership = requireMembership(serverId, userId);
        if (!membership.getRole().canManageServer()) {
            throw ApiException.forbidden("Seuls les admins du serveur peuvent faire ça");
        }
        return membership;
    }

    /** Salon (ou conversation privée) existant et accessible, sinon 404 / 403. */
    public Channel requireChannel(Long channelId, Long userId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> ApiException.notFound("Salon introuvable"));
        if (channel.isDirect()) {
            if (!channel.isParticipant(userId)) {
                throw ApiException.forbidden("Cette conversation ne te concerne pas");
            }
            return channel;
        }
        requireMembership(channel.getServer().getId(), userId);
        return channel;
    }
}
