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
import lombok.Setter;

import java.time.Instant;

/** Un serveur = une communauté avec ses salons et ses membres. */
@Entity
@Table(name = "servers")
@Getter
@Setter
@NoArgsConstructor
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Emoji servant d'icône, ou null pour afficher les initiales. */
    private String icon;

    @Column(nullable = false)
    private String color;

    /** Visible dans « Explorer » et rejoignable sans invitation. */
    @Column(name = "is_public", nullable = false)
    private boolean publicServer;

    /** Serveur rejoint automatiquement par chaque nouvel inscrit. */
    @Column(name = "is_default", nullable = false)
    private boolean defaultServer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Server(String name, String color, User owner) {
        this.name = name;
        this.color = color;
        this.owner = owner;
    }
}
