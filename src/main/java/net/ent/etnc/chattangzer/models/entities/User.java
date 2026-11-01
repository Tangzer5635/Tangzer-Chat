package net.ent.etnc.chattangzer.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Identifiant de connexion, unique, en minuscules. */
    @Column(nullable = false, unique = true)
    private String username;

    /** Nom affiché dans l'interface (modifiable, non unique). */
    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public User(String username, String displayName, String passwordHash) {
        this.username = username;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
    }
}
