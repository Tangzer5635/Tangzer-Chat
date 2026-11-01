package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.MemberRole;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.ServerRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ServerServiceTest {

    @Autowired
    private ServerService serverService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServerRepository serverRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User owner;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(new User("owner", "Owner", "x"));
        alice = userRepository.save(new User("alice", "Alice", "x"));
        bob = userRepository.save(new User("bob", "Bob", "x"));
    }

    private ServerDto createServer(boolean isPublic) {
        return serverService.create(owner.getId(), new ServerRequest("Les Potes", null, "🎮", null, isPublic));
    }

    @Test
    void creatorBecomesOwnerAndGetsAGeneralChannel() {
        ServerDto server = createServer(false);

        assertThat(server.myRole()).isEqualTo(MemberRole.OWNER);
        assertThat(server.memberCount()).isEqualTo(1);
        assertThat(server.icon()).isEqualTo("🎮");
        assertThat(server.color()).matches("^#[0-9a-f]{6}$");
        assertThat(server.channels()).extracting("name").containsExactly("général");
        assertThat(serverService.listForUser(owner.getId())).extracting("id").containsExactly(server.id());
    }

    @Test
    void serverNameAndColorAreValidated() {
        assertThatThrownBy(() -> serverService.create(owner.getId(), new ServerRequest("x", null, null, null, false)))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> serverService.create(owner.getId(), new ServerRequest("Valide", null, null, "rouge", false)))
                .hasMessageContaining("#rrggbb");
    }

    @Test
    void onlyManagersCanUpdateTheServer() {
        ServerDto server = createServer(true);
        serverService.join(server.id(), alice.getId());

        assertThatThrownBy(() -> serverService.update(server.id(), alice.getId(), new ServerRequest("Piraté", null, null, null, null)))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);

        serverService.changeRole(server.id(), owner.getId(), alice.getId(), MemberRole.ADMIN);
        ServerDto updated = serverService.update(server.id(), alice.getId(), new ServerRequest("Renommé", null, "", null, null));

        assertThat(updated.name()).isEqualTo("Renommé");
        assertThat(updated.icon()).isNull();
    }

    @Test
    void privateServerNeedsAnInvite() {
        ServerDto server = createServer(false);

        assertThatThrownBy(() -> serverService.join(server.id(), alice.getId()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void joiningTwiceDoesNotDuplicateTheMembership() {
        ServerDto server = createServer(true);

        serverService.join(server.id(), alice.getId());
        ServerDto again = serverService.join(server.id(), alice.getId());

        assertThat(again.memberCount()).isEqualTo(2);
        assertThat(again.myRole()).isEqualTo(MemberRole.MEMBER);
    }

    @Test
    void discoverListsPublicServersOnly() {
        ServerDto publicServer = createServer(true);
        serverService.create(owner.getId(), new ServerRequest("Secret", null, null, null, false));

        assertThat(serverService.discover("", alice.getId()))
                .extracting("id").containsExactly(publicServer.id());
        assertThat(serverService.discover("POTES", owner.getId()))
                .singleElement().extracting("joined").isEqualTo(true);
        assertThat(serverService.discover("introuvable", alice.getId())).isEmpty();
    }

    @Test
    void ownerCannotLeaveButMembersCan() {
        ServerDto server = createServer(true);
        serverService.join(server.id(), alice.getId());

        assertThatThrownBy(() -> serverService.leave(server.id(), owner.getId()))
                .isInstanceOf(ApiException.class);

        serverService.leave(server.id(), alice.getId());
        assertThat(serverService.listForUser(alice.getId())).isEmpty();
    }

    @Test
    void kickRulesFollowTheRoleHierarchy() {
        ServerDto server = createServer(true);
        serverService.join(server.id(), alice.getId());
        serverService.join(server.id(), bob.getId());
        serverService.changeRole(server.id(), owner.getId(), alice.getId(), MemberRole.ADMIN);
        serverService.changeRole(server.id(), owner.getId(), bob.getId(), MemberRole.ADMIN);

        // Un admin ne peut expulser ni un autre admin, ni le propriétaire.
        assertThatThrownBy(() -> serverService.kick(server.id(), alice.getId(), bob.getId()))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> serverService.kick(server.id(), alice.getId(), owner.getId()))
                .isInstanceOf(ApiException.class);

        // Le propriétaire peut expulser un admin, qui est prévenu.
        serverService.kick(server.id(), owner.getId(), bob.getId());
        assertThat(serverService.listForUser(bob.getId())).isEmpty();
        verify(realtime).toUser(eq("bob"), eq("SERVER_REMOVED"), any());
    }

    @Test
    void onlyTheOwnerChangesRoles() {
        ServerDto server = createServer(true);
        serverService.join(server.id(), alice.getId());
        serverService.join(server.id(), bob.getId());
        serverService.changeRole(server.id(), owner.getId(), alice.getId(), MemberRole.ADMIN);

        assertThatThrownBy(() -> serverService.changeRole(server.id(), alice.getId(), bob.getId(), MemberRole.ADMIN))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> serverService.changeRole(server.id(), owner.getId(), bob.getId(), MemberRole.OWNER))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void onlyTheOwnerDeletesAndTheDefaultServerStays() {
        ServerDto server = createServer(true);
        serverService.join(server.id(), alice.getId());

        assertThatThrownBy(() -> serverService.delete(server.id(), alice.getId()))
                .isInstanceOf(ApiException.class);

        serverService.delete(server.id(), owner.getId());
        assertThat(serverRepository.findById(server.id())).isEmpty();

        serverService.joinDefaultServer(owner);
        Long defaultId = serverRepository.findFirstByDefaultServerTrue().orElseThrow().getId();
        assertThatThrownBy(() -> serverService.delete(defaultId, owner.getId()))
                .hasMessageContaining("ne peut pas être supprimé");
    }

    @Test
    void firstUserCreatesTheDefaultServerAndOthersJoinIt() {
        serverService.joinDefaultServer(owner);
        serverService.joinDefaultServer(alice);

        ServerDto seenByAlice = serverService.listForUser(alice.getId()).getFirst();
        assertThat(seenByAlice.name()).isEqualTo("Tangzer");
        assertThat(seenByAlice.isDefault()).isTrue();
        assertThat(seenByAlice.isPublic()).isTrue();
        assertThat(seenByAlice.myRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(seenByAlice.ownerId()).isEqualTo(owner.getId());
        assertThat(seenByAlice.channels()).extracting("name").contains("général", "dev", "wb47");
    }

    @Test
    void nonMembersCannotSeeAServer() {
        ServerDto server = createServer(false);

        assertThatThrownBy(() -> serverService.get(server.id(), alice.getId()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        assertThatThrownBy(() -> serverService.listMembers(server.id(), alice.getId()))
                .isInstanceOf(ApiException.class);
    }
}
