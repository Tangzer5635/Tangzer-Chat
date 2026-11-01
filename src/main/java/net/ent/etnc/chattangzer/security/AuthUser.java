package net.ent.etnc.chattangzer.security;

import net.ent.etnc.chattangzer.models.entities.User;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.Principal;
import java.util.Collection;
import java.util.List;

/**
 * Utilisateur authentifié, disponible dans les contrôleurs via
 * {@code @AuthenticationPrincipal AuthUser me} (REST) ou {@code AuthUser.from(principal)} (STOMP).
 */
public record AuthUser(Long id, String username, String passwordHash) implements UserDetails {

    public static AuthUser of(User user) {
        return new AuthUser(user.getId(), user.getUsername(), user.getPasswordHash());
    }

    /** Récupère l'utilisateur derrière le Principal d'une session STOMP. */
    public static AuthUser from(Principal principal) {
        if (principal instanceof Authentication authentication
                && authentication.getPrincipal() instanceof AuthUser authUser) {
            return authUser;
        }
        throw new IllegalStateException("Utilisateur non authentifié");
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
