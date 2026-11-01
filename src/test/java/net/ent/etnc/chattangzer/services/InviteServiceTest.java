package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.InviteDto;
import net.ent.etnc.chattangzer.models.dtos.InviteRequest;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.Invite;
import net.ent.etnc.chattangzer.models.entities.MemberRole;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.InviteRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InviteServiceTest {

    @Autowired
    private InviteService inviteService;

    @Autowired
    private ServerService serverService;

    @Autowired
    private InviteRepository inviteRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User owner;
    private User alice;
    private User bob;
    private ServerDto server;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(new User("owner", "Owner", "x"));
        alice = userRepository.save(new User("alice", "Alice", "x"));
        bob = userRepository.save(new User("bob", "Bob", "x"));
        server = serverService.create(owner.getId(), new ServerRequest("Privé", null, null, null, false));
    }

    @Test
    void acceptingAnInviteJoinsThePrivateServer() {
        InviteDto invite = inviteService.create(server.id(), owner.getId(), new InviteRequest(24, null));

        assertThat(invite.code()).hasSize(8);
        assertThat(invite.expiresAt()).isAfter(Instant.now());

        ServerDto joined = inviteService.accept(invite.code(), alice.getId());

        assertThat(joined.id()).isEqualTo(server.id());
        assertThat(joined.myRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(inviteRepository.findById(invite.code()).orElseThrow().getUses()).isEqualTo(1);
    }

    @Test
    void previewShowsTheServerAndWhetherTheInviteIsValid() {
        InviteDto invite = inviteService.create(server.id(), owner.getId(), null);

        var preview = inviteService.preview(invite.code(), alice.getId());

        assertThat(preview.valid()).isTrue();
        assertThat(preview.server().name()).isEqualTo("Privé");
        assertThat(preview.server().joined()).isFalse();
        assertThat(preview.inviter().username()).isEqualTo("owner");
    }

    @Test
    void alreadyMembersDoNotConsumeTheInvite() {
        InviteDto invite = inviteService.create(server.id(), owner.getId(), new InviteRequest(null, 1));

        inviteService.accept(invite.code(), owner.getId());

        assertThat(inviteRepository.findById(invite.code()).orElseThrow().getUses()).isZero();
    }

    @Test
    void exhaustedInviteIsRefused() {
        InviteDto invite = inviteService.create(server.id(), owner.getId(), new InviteRequest(null, 1));
        inviteService.accept(invite.code(), alice.getId());

        assertThatThrownBy(() -> inviteService.accept(invite.code(), bob.getId()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.GONE);
    }

    @Test
    void expiredInviteIsRefused() {
        InviteDto invite = inviteService.create(server.id(), owner.getId(), new InviteRequest(1, null));
        Invite stored = inviteRepository.findById(invite.code()).orElseThrow();
        stored.setExpiresAt(Instant.now().minusSeconds(1));

        assertThat(inviteService.preview(invite.code(), alice.getId()).valid()).isFalse();
        assertThatThrownBy(() -> inviteService.accept(invite.code(), alice.getId()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.GONE);
    }

    @Test
    void strangersCannotCreateInvitesAndOptionsAreBounded() {
        assertThatThrownBy(() -> inviteService.create(server.id(), alice.getId(), null))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> inviteService.create(server.id(), owner.getId(), new InviteRequest(0, null)))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> inviteService.create(server.id(), owner.getId(), new InviteRequest(null, 5000)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void unknownCodeGives404() {
        assertThatThrownBy(() -> inviteService.preview("inconnu", alice.getId()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
    }
}
