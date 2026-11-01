package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.AttachmentDto;
import net.ent.etnc.chattangzer.models.entities.Attachment;
import net.ent.etnc.chattangzer.repositories.AttachmentRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Photos : envoi (vérifié), rattachement à un message, lecture, nettoyage.
 *
 * Parcours : le front envoie la photo dès qu'on la choisit (POST /api/attachments),
 * puis poste le message avec la liste des identifiants reçus.
 */
@Service
@Transactional
public class AttachmentService {

    private static final Logger log = LoggerFactory.getLogger(AttachmentService.class);

    public static final int MAX_PER_MESSAGE = 4;
    private static final Duration ORPHAN_DELAY = Duration.ofHours(24);

    private final AttachmentRepository attachmentRepository;
    private final StorageService storage;
    private final long maxSizeBytes;

    public AttachmentService(
            AttachmentRepository attachmentRepository,
            StorageService storage,
            @Value("${app.storage.max-file-size-bytes}") long maxSizeBytes
    ) {
        this.attachmentRepository = attachmentRepository;
        this.storage = storage;
        this.maxSizeBytes = maxSizeBytes;
    }

    /** Vérifie et enregistre une image ; elle n'appartient encore à aucun message. */
    public AttachmentDto upload(Long uploaderId, String originalName, byte[] content) {
        if (content == null || content.length == 0) {
            throw ApiException.badRequest("Le fichier est vide");
        }
        if (content.length > maxSizeBytes) {
            throw ApiException.badRequest("L'image dépasse la taille maximale de " + (maxSizeBytes / 1024 / 1024) + " Mo");
        }

        String contentType = ImageInspector.detectType(Arrays.copyOf(content, Math.min(content.length, 16)));
        if (contentType == null) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Seules les images PNG, JPEG, GIF et WEBP sont acceptées");
        }

        Attachment attachment = new Attachment();
        attachment.setId(UUID.randomUUID().toString());
        attachment.setUploaderId(uploaderId);
        attachment.setFileName(cleanFileName(originalName, contentType));
        attachment.setContentType(contentType);
        attachment.setSize(content.length);

        ImageInspector.Dimensions dimensions = ImageInspector.readDimensions(content);
        if (dimensions != null) {
            attachment.setWidth(dimensions.width());
            attachment.setHeight(dimensions.height());
        }

        storage.save(attachment.getId(), content);
        return AttachmentDto.from(attachmentRepository.save(attachment));
    }

    /** Rattache mes photos (pas encore utilisées) à un message qui vient d'être posté. */
    public List<AttachmentDto> attachToMessage(Long messageId, Long uploaderId, List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<String> distinct = new ArrayList<>(new LinkedHashSet<>(ids));
        if (distinct.size() > MAX_PER_MESSAGE) {
            throw ApiException.badRequest("Pas plus de " + MAX_PER_MESSAGE + " images par message");
        }

        List<AttachmentDto> attached = new ArrayList<>();
        for (String id : distinct) {
            Attachment attachment = attachmentRepository.findById(id)
                    .filter(a -> a.getUploaderId().equals(uploaderId) && a.getMessageId() == null)
                    .orElseThrow(() -> ApiException.badRequest("Une des images n'est plus disponible, renvoie-la"));
            attachment.setMessageId(messageId);
            attached.add(AttachmentDto.from(attachment));
        }
        return attached;
    }

    @Transactional(readOnly = true)
    public Map<Long, List<AttachmentDto>> byMessage(List<Long> messageIds) {
        Map<Long, List<AttachmentDto>> result = new LinkedHashMap<>();
        if (messageIds.isEmpty()) {
            return result;
        }
        for (Attachment attachment : attachmentRepository.findAllByMessageIdInOrderByCreatedAtAsc(messageIds)) {
            result.computeIfAbsent(attachment.getMessageId(), id -> new ArrayList<>()).add(AttachmentDto.from(attachment));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Attachment get(String id) {
        return attachmentRepository.findById(id == null ? "" : id)
                .filter(a -> storage.exists(a.getId()))
                .orElseThrow(() -> ApiException.notFound("Image introuvable"));
    }

    /** Supprime les fichiers d'un message (la base les supprime en cascade avec lui). */
    public void deleteForMessage(Long messageId) {
        List<Attachment> attachments = attachmentRepository.findAllByMessageId(messageId);
        attachments.forEach(a -> storage.delete(a.getId()));
        attachmentRepository.deleteAll(attachments);
    }

    /**
     * Ménage quotidien : photos jamais postées depuis 24 h, et fichiers dont
     * l'entrée a disparu de la base (message, salon ou serveur supprimé).
     */
    @Scheduled(cron = "0 17 4 * * *")
    public void cleanUp() {
        List<Attachment> orphans = attachmentRepository.findAllByMessageIdIsNullAndCreatedAtBefore(Instant.now().minus(ORPHAN_DELAY));
        orphans.forEach(a -> storage.delete(a.getId()));
        attachmentRepository.deleteAll(orphans);

        long removedFiles = 0;
        try (Stream<String> ids = storage.listIds()) {
            for (String id : ids.toList()) {
                if (!attachmentRepository.existsById(id)) {
                    storage.delete(id);
                    removedFiles++;
                }
            }
        }

        if (!orphans.isEmpty() || removedFiles > 0) {
            log.info("Nettoyage des images : {} non utilisées, {} fichiers orphelins", orphans.size(), removedFiles);
        }
    }

    /** Garde un nom lisible pour le téléchargement, sans chemin ni caractère gênant. */
    static String cleanFileName(String originalName, String contentType) {
        String name = originalName == null ? "" : originalName.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "").strip();
        if (name.isEmpty()) {
            name = "image." + contentType.substring("image/".length());
        }
        return name.length() > 100 ? name.substring(name.length() - 100) : name;
    }
}
