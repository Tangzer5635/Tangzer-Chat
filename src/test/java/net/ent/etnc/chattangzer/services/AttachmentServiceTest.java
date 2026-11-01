package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.AttachmentDto;
import net.ent.etnc.chattangzer.models.dtos.MessageDto;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.Attachment;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.AttachmentRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;
import net.ent.etnc.chattangzer.support.TestImages;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AttachmentServiceTest {

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ServerService serverService;

    @Autowired
    private StorageService storage;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User alice;
    private User bob;
    private Long channelId;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(new User("alice", "Alice", "x"));
        bob = userRepository.save(new User("bob", "Bob", "x"));
        ServerDto server = serverService.create(alice.getId(), new ServerRequest("Photos", null, null, null, true));
        serverService.join(server.id(), bob.getId());
        channelId = server.channels().getFirst().id();
    }

    private AttachmentDto upload(User user) {
        return attachmentService.upload(user.getId(), "vacances.png", TestImages.png(640, 480));
    }

    private MessageDto send(User author, String content, List<String> attachmentIds) {
        return messageService.send(channelId, author.getId(), new MessageRequests.Send(content, null, null, attachmentIds));
    }

    @Test
    void uploadStoresTheImageWithItsRealTypeAndSize() {
        AttachmentDto dto = upload(alice);

        assertThat(dto.contentType()).isEqualTo("image/png");
        assertThat(dto.width()).isEqualTo(640);
        assertThat(dto.height()).isEqualTo(480);
        assertThat(dto.fileName()).isEqualTo("vacances.png");
        assertThat(dto.url()).isEqualTo("/api/attachments/" + dto.id());
        assertThat(storage.exists(dto.id())).isTrue();
    }

    @Test
    void nonImagesAreRefusedWhateverTheirName() {
        assertThatThrownBy(() -> attachmentService.upload(alice.getId(), "photo.png",
                "<html>pas une image</html>".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        assertThatThrownBy(() -> attachmentService.upload(alice.getId(), "vide.png", new byte[0]))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void tooLargeImagesAreRefused() {
        byte[] png = TestImages.png(2, 2);
        byte[] huge = Arrays.copyOf(png, 10 * 1024 * 1024 + 1);

        assertThatThrownBy(() -> attachmentService.upload(alice.getId(), "énorme.png", huge))
                .hasMessageContaining("taille maximale");
    }

    @Test
    void aMessageCanBeJustAPhoto() {
        AttachmentDto photo = upload(alice);

        MessageDto message = send(alice, "", List.of(photo.id()));

        assertThat(message.content()).isEmpty();
        assertThat(message.attachments()).extracting("id").containsExactly(photo.id());
        assertThat(messageService.history(channelId, bob.getId(), null, null).getFirst().attachments())
                .extracting("width").containsExactly(640);
        assertThatThrownBy(() -> send(alice, "  ", List.of())).hasMessageContaining("vide");
    }

    @Test
    void onlyMyOwnUnusedPhotosCanBeAttached() {
        AttachmentDto alicePhoto = upload(alice);

        assertThatThrownBy(() -> send(bob, "je vole la photo", List.of(alicePhoto.id())))
                .isInstanceOf(ApiException.class);

        send(alice, "première fois", List.of(alicePhoto.id()));
        assertThatThrownBy(() -> send(alice, "deuxième fois", List.of(alicePhoto.id())))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void atMostFourPhotosPerMessage() {
        List<String> five = List.of(upload(alice).id(), upload(alice).id(), upload(alice).id(),
                upload(alice).id(), upload(alice).id());

        assertThatThrownBy(() -> send(alice, "trop", five)).hasMessageContaining("4");
    }

    @Test
    void deletingTheMessageDeletesItsFiles() {
        AttachmentDto photo = upload(alice);
        MessageDto message = send(alice, "bientôt supprimée", List.of(photo.id()));

        messageService.delete(message.id(), alice.getId());

        assertThat(storage.exists(photo.id())).isFalse();
        assertThat(attachmentRepository.findById(photo.id())).isEmpty();
    }

    @Test
    void cleanUpRemovesOldUnusedPhotosOnly() {
        AttachmentDto old = upload(alice);
        AttachmentDto recent = upload(alice);
        Attachment stored = attachmentRepository.findById(old.id()).orElseThrow();
        stored.setCreatedAt(Instant.now().minusSeconds(48 * 3600));

        attachmentService.cleanUp();

        assertThat(storage.exists(old.id())).isFalse();
        assertThat(storage.exists(recent.id())).isTrue();
    }

    @Test
    void fileNamesAreCleaned() {
        assertThat(AttachmentService.cleanFileName("../../etc/passwd.png", "image/png")).isEqualTo("....etcpasswd.png");
        assertThat(AttachmentService.cleanFileName(null, "image/jpeg")).isEqualTo("image.jpeg");
    }
}
