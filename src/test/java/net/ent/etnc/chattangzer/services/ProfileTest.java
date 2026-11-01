package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.AttachmentDto;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.ProfileRequests;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.Attachment;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.AttachmentRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;
import net.ent.etnc.chattangzer.support.TestImages;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProfileTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private ServerService serverService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private StorageService storage;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private RealtimeService realtime;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(new User("alice", "Alice", passwordEncoder.encode("ancien-mdp")));
        bob = userRepository.save(new User("bob", "Bob", "x"));
    }

    private AttachmentDto upload(User user) {
        return attachmentService.upload(user.getId(), "photo.png", TestImages.png(256, 256));
    }

    @Test
    void profileUpdatesAreBroadcastToEveryone() {
        AttachmentDto avatar = upload(alice);

        User updated = userService.updateProfile(alice.getId(),
                new ProfileRequests.Profile("Alice ✨", "  Dev le jour, gameuse la nuit  ", "#EB459E", avatar.id()));

        assertThat(updated.getDisplayName()).isEqualTo("Alice ✨");
        assertThat(updated.getBio()).isEqualTo("Dev le jour, gameuse la nuit");
        assertThat(updated.getBannerColor()).isEqualTo("#eb459e");
        assertThat(UserDto.from(updated).avatarUrl()).isEqualTo("/api/attachments/" + avatar.id());
        verify(realtime).toTopic(eq("/topic/users"), eq("USER_UPDATED"), any(UserDto.class));
    }

    @Test
    void emptyValuesResetToDefaults() {
        userService.updateProfile(alice.getId(), new ProfileRequests.Profile(null, "bio", "#ffffff", upload(alice).id()));

        User reset = userService.updateProfile(alice.getId(), new ProfileRequests.Profile(null, "", "", ""));

        assertThat(reset.getBio()).isNull();
        assertThat(reset.getBannerColor()).isNull();
        assertThat(reset.getAvatarId()).isNull();
        assertThat(reset.getDisplayName()).isEqualTo("Alice");
    }

    @Test
    void avatarMustBeMyOwnImage() {
        AttachmentDto bobsImage = upload(bob);

        assertThatThrownBy(() -> userService.updateProfile(alice.getId(),
                new ProfileRequests.Profile(null, null, null, bobsImage.id())))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> userService.updateProfile(alice.getId(),
                new ProfileRequests.Profile(null, "x".repeat(191), null, null)))
                .hasMessageContaining("190");
        assertThatThrownBy(() -> userService.updateProfile(alice.getId(),
                new ProfileRequests.Profile(null, null, "rose", null)))
                .hasMessageContaining("#rrggbb");
    }

    @Test
    void preferencesAreValidated() {
        User user = userService.updatePreferences(alice.getId(),
                new ProfileRequests.Preferences("clair", "#57F287", 18, true));

        assertThat(user.getTheme()).isEqualTo("clair");
        assertThat(user.getAccentColor()).isEqualTo("#57f287");
        assertThat(user.getFontSize()).isEqualTo(18);
        assertThat(user.isCompact()).isTrue();

        assertThatThrownBy(() -> userService.updatePreferences(alice.getId(),
                new ProfileRequests.Preferences("fluo", null, null, null)))
                .hasMessageContaining("Thème");
        assertThatThrownBy(() -> userService.updatePreferences(alice.getId(),
                new ProfileRequests.Preferences(null, null, 40, null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void passwordChangeRequiresTheCurrentOne() {
        assertThatThrownBy(() -> userService.changePassword(alice.getId(), "mauvais", "nouveau-mdp"))
                .hasMessageContaining("actuel");
        assertThatThrownBy(() -> userService.changePassword(alice.getId(), "ancien-mdp", "123"))
                .isInstanceOf(ApiException.class);

        userService.changePassword(alice.getId(), "ancien-mdp", "nouveau-mdp");

        assertThat(passwordEncoder.matches("nouveau-mdp", userService.getById(alice.getId()).getPasswordHash())).isTrue();
    }

    @Test
    void serversCanUseAnImageAsIcon() {
        AttachmentDto icon = upload(alice);

        ServerDto server = serverService.create(alice.getId(),
                new ServerRequest("Avec image", null, null, null, false, icon.id()));
        assertThat(server.iconUrl()).isEqualTo("/api/attachments/" + icon.id());

        ServerDto without = serverService.update(server.id(), alice.getId(),
                new ServerRequest(null, null, null, null, null, ""));
        assertThat(without.iconUrl()).isNull();
    }

    @Test
    void cleanUpKeepsAvatarsAndServerIcons() {
        AttachmentDto avatar = upload(alice);
        AttachmentDto unused = upload(alice);
        userService.updateProfile(alice.getId(), new ProfileRequests.Profile(null, null, null, avatar.id()));
        for (String id : List.of(avatar.id(), unused.id())) {
            Attachment attachment = attachmentRepository.findById(id).orElseThrow();
            attachment.setCreatedAt(Instant.now().minusSeconds(3 * 24 * 3600));
        }

        attachmentService.cleanUp();

        assertThat(storage.exists(avatar.id())).isTrue();
        assertThat(storage.exists(unused.id())).isFalse();
    }

    @Test
    void messageAuthorsCarryTheirAvatar() {
        AttachmentDto avatar = upload(alice);
        userService.updateProfile(alice.getId(), new ProfileRequests.Profile(null, null, null, avatar.id()));
        ServerDto server = serverService.create(alice.getId(), new ServerRequest("Salon perso", null, null, null, false));

        var message = messageService.send(server.channels().getFirst().id(), alice.getId(),
                new MessageRequests.Send("coucou", null, null));

        assertThat(message.author().avatarUrl()).isEqualTo("/api/attachments/" + avatar.id());
    }
}
