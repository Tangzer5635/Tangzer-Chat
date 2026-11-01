package net.ent.etnc.chattangzer.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Lien d'invitation vers un serveur : /invite/{code}. */
@Entity
@Table(name = "invites")
@Getter
@Setter
@NoArgsConstructor
public class Invite {

    @Id
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "server_id")
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    /** null = n'expire jamais. */
    private Instant expiresAt;

    /** null = utilisations illimitées. */
    private Integer maxUses;

    @Column(nullable = false)
    private int uses;

    public Invite(String code, Server server, User createdBy, Instant expiresAt, Integer maxUses) {
        this.code = code;
        this.server = server;
        this.createdBy = createdBy;
        this.expiresAt = expiresAt;
        this.maxUses = maxUses;
    }

    /** Vrai si l'invitation peut encore être utilisée à l'instant donné. */
    public boolean isUsableAt(Instant now) {
        boolean expired = expiresAt != null && !now.isBefore(expiresAt);
        boolean exhausted = maxUses != null && uses >= maxUses;
        return !expired && !exhausted;
    }
}
