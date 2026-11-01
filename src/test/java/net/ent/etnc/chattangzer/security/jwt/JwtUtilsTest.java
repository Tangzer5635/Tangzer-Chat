package net.ent.etnc.chattangzer.security.jwt;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilsTest {

    private static final String SECRET = "un-secret-de-test-suffisamment-long-pour-hmac-sha-256";

    private final JwtUtils jwtUtils = new JwtUtils(SECRET, 60_000);

    @Test
    void generatedTokenIsValidAndCarriesUsername() {
        String token = jwtUtils.generateToken("tanguy");

        assertThat(jwtUtils.validateJwtToken(token)).isTrue();
        assertThat(jwtUtils.getUsernameFromJwtToken(token)).isEqualTo("tanguy");
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtUtils other = new JwtUtils("un-autre-secret-tout-aussi-long-pour-hmac-sha-256", 60_000);

        assertThat(jwtUtils.validateJwtToken(other.generateToken("tanguy"))).isFalse();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtUtils expired = new JwtUtils(SECRET, -1_000);

        assertThat(jwtUtils.validateJwtToken(expired.generateToken("tanguy"))).isFalse();
    }

    @Test
    void blankOrGarbageTokenIsRejected() {
        assertThat(jwtUtils.validateJwtToken(null)).isFalse();
        assertThat(jwtUtils.validateJwtToken("  ")).isFalse();
        assertThat(jwtUtils.validateJwtToken("pas.un.jwt")).isFalse();
    }

    @Test
    void tooShortSecretIsRefusedAtStartup() {
        assertThatThrownBy(() -> new JwtUtils("trop-court", 60_000))
                .isInstanceOf(IllegalStateException.class);
    }
}
