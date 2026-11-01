package net.ent.etnc.chattangzer.models.dtos;

import java.time.Instant;
import java.util.List;

/**
 * Message tel qu'affiché par le front.
 * {@code nonce} : identifiant temporaire choisi par l'expéditeur, renvoyé tel quel
 * pour remplacer son message « en cours d'envoi » par le vrai.
 */
public record MessageDto(
        Long id,
        Long channelId,
        UserDto author,
        String content,
        Instant createdAt,
        Instant editedAt,
        MessagePreviewDto replyTo,
        List<ReactionDto> reactions,
        List<AttachmentDto> attachments,
        String nonce
) {
}
