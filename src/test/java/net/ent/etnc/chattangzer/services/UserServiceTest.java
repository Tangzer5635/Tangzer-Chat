package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registerNormalizesUsernameAndHashesPassword() {
        User user = userService.register("  Tanguy ", "Tanguy L.", "secret123");

        assertThat(user.getId()).isNotNull();
        assertThat(user.getUsername()).isEqualTo("tanguy");
        assertThat(user.getDisplayName()).isEqualTo("Tanguy L.");
        assertThat(user.getPasswordHash()).isNotEqualTo("secret123");
        assertThat(passwordEncoder.matches("secret123", user.getPasswordHash())).isTrue();
    }

    @Test
    void displayNameDefaultsToUsername() {
        User user = userService.register("pigloo", "   ", "secret123");

        assertThat(user.getDisplayName()).isEqualTo("pigloo");
    }

    @Test
    void usernameIsUniqueRegardlessOfCase() {
        userService.register("admin", null, "secret123");

        assertThatThrownBy(() -> userService.register("ADMIN", null, "secret123"))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void invalidUsernameIsRejected() {
        assertThatThrownBy(() -> userService.register("ab", null, "secret123"))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);

        assertThatThrownBy(() -> userService.register("avec espace", null, "secret123"))
                .isInstanceOf(ApiException.class);

        assertThatThrownBy(() -> userService.register("beaucoup-trop-long-pour-un-pseudo", null, "secret123"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void shortPasswordIsRejected() {
        assertThatThrownBy(() -> userService.register("valide", null, "123"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("au moins");
    }

    @Test
    void tooLongDisplayNameIsRejected() {
        assertThatThrownBy(() -> userService.register("valide", "x".repeat(33), "secret123"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void getByUsernameIgnoresCase() {
        userService.register("tanguy", null, "secret123");

        assertThat(userService.getByUsername("TANGUY").getUsername()).isEqualTo("tanguy");
    }

    @Test
    void statusCanBeChangedButNeverToOffline() {
        User user = userService.register("statut", null, "secret123");

        User updated = userService.updateStatus(user.getId(), UserStatus.DND, "  🎧 Concentré  ");
        assertThat(updated.getStatus()).isEqualTo(UserStatus.DND);
        assertThat(updated.getCustomStatus()).isEqualTo("🎧 Concentré");

        assertThat(userService.updateStatus(user.getId(), UserStatus.ONLINE, "").getCustomStatus()).isNull();
        assertThatThrownBy(() -> userService.updateStatus(user.getId(), UserStatus.OFFLINE, null))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> userService.updateStatus(user.getId(), UserStatus.ONLINE, "x".repeat(81)))
                .isInstanceOf(ApiException.class);
    }
}
