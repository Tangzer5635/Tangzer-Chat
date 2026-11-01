package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ChannelDto;
import net.ent.etnc.chattangzer.models.dtos.ChannelRequest;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChannelServiceTest {

    @Autowired
    private ChannelService channelService;

    @Autowired
    private ServerService serverService;

    @Autowired
    private AccessService accessService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User owner;
    private User member;
    private User stranger;
    private ServerDto server;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(new User("owner", "Owner", "x"));
        member = userRepository.save(new User("member", "Member", "x"));
        stranger = userRepository.save(new User("stranger", "Stranger", "x"));
        server = serverService.create(owner.getId(), new ServerRequest("Serveur", null, null, null, true));
        serverService.join(server.id(), member.getId());
    }

    @Test
    void channelNamesFollowTheDiscordStyle() {
        assertThat(ChannelService.normalizeName("Mon Salon")).isEqualTo("mon-salon");
        assertThat(ChannelService.normalizeName("  ## Dev   Ops ##  ")).isEqualTo("dev-ops");
        assertThat(ChannelService.normalizeName("Café 🎉")).isEqualTo("café-🎉");
        assertThatThrownBy(() -> ChannelService.normalizeName("  #  ")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> ChannelService.normalizeName("x".repeat(33))).isInstanceOf(ApiException.class);
    }

    @Test
    void managerCreatesChannelsAtTheEnd() {
        ChannelDto channel = channelService.create(server.id(), owner.getId(),
                new ChannelRequest("Jeux Vidéo", "On parle de jeux", null));

        assertThat(channel.name()).isEqualTo("jeux-vidéo");
        assertThat(channel.topic()).isEqualTo("On parle de jeux");
        assertThat(channel.position()).isEqualTo(1);
        assertThat(serverService.get(server.id(), member.getId()).channels())
                .extracting("name").containsExactly("général", "jeux-vidéo");
    }

    @Test
    void simpleMembersCannotManageChannels() {
        assertThatThrownBy(() -> channelService.create(server.id(), member.getId(), new ChannelRequest("nope", null, null)))
                .isInstanceOf(ApiException.class);

        Long general = server.channels().getFirst().id();
        assertThatThrownBy(() -> channelService.update(general, member.getId(), new ChannelRequest("renommé", null, null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void theLastTextChannelCannotBeDeleted() {
        Long general = server.channels().getFirst().id();

        assertThatThrownBy(() -> channelService.delete(general, owner.getId()))
                .hasMessageContaining("au moins un salon");

        ChannelDto second = channelService.create(server.id(), owner.getId(), new ChannelRequest("second", null, null));
        channelService.delete(general, owner.getId());
        assertThat(serverService.get(server.id(), owner.getId()).channels())
                .extracting("id").containsExactly(second.id());
    }

    @Test
    void onlyMembersCanAccessAChannel() {
        Long general = server.channels().getFirst().id();

        assertThat(accessService.canAccessChannel(general, member.getId())).isTrue();
        assertThat(accessService.canAccessChannel(general, stranger.getId())).isFalse();
        assertThat(accessService.canAccessChannel(999_999L, member.getId())).isFalse();
    }
}
