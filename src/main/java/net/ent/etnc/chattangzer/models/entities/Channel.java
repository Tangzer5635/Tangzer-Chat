package net.ent.etnc.chattangzer.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** Salon d'un serveur. */
@Entity
@Table(name = "channels")
@Getter
@Setter
@NoArgsConstructor
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "server_id")
    private Server server;

    @Column(nullable = false)
    private String name;

    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChannelType type;

    /** Ordre d'affichage dans la liste des salons. */
    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Channel(Server server, String name, ChannelType type, int position) {
        this.server = server;
        this.name = name;
        this.type = type;
        this.position = position;
    }
}
