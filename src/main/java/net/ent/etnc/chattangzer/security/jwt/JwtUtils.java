package net.ent.etnc.chattangzer.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utilitaire JWT : génération, validation et parsing des tokens.
 *
 * Même pattern que le projet Jurassic Park :
 *   - validateJwtToken()        → boolean
 *   - getUsernameFromJwtToken() → String
 *   - generateJwtToken()        → String
 */
@Component
public class JwtUtils {

    @Value("${app.security.jwt.secret}")
    private String secret;

    @Value("${app.security.jwt.expiration}")
    private long jwtExpirationMs;

    /**
     * Génère un token JWT après authentification réussie.
     */
    public String generateJwtToken(Authentication authentication) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(
                        System.currentTimeMillis() + jwtExpirationMs
                ))
                .signWith(getSecretKey())
                .compact();
    }

    /**
     * Valide un token JWT (signature + expiration).
     * Retourne false si le token est null, invalide ou expiré.
     */
    public boolean validateJwtToken(String token) {

        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token);
            return true;

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extrait le username (subject) d'un token JWT valide.
     */
    public String getUsernameFromJwtToken(String token) {

        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }
}