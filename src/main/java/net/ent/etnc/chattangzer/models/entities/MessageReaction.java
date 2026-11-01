package net.ent.etnc.chattangzer.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Réaction emoji d'un utilisateur sur un message. */
@Entity
@Table(name = "message_reactions")
@Getter
@NoArgsConstructor
public class MessageReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id")
    private Message message;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String emoji;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public MessageReaction(Message message, Long userId, String emoji) {
        this.message = message;
        this.userId = userId;
        this.emoji = emoji;
    }
}
