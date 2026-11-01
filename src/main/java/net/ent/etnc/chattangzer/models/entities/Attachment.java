package net.ent.etnc.chattangzer.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Photo envoyée par un utilisateur, rattachée à un message une fois celui-ci posté. */
@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
public class Attachment {

    /** UUID aléatoire, utilisé aussi comme nom de fichier sur le disque. */
    @Id
    private String id;

    @Column(name = "uploader_id", nullable = false)
    private Long uploaderId;

    /** null tant que la photo n'est pas encore dans un message. */
    @Column(name = "message_id")
    private Long messageId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long size;

    private Integer width;

    private Integer height;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
