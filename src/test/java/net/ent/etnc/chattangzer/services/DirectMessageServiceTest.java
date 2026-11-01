package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ChannelRequest;
import net.ent.etnc.chattangzer.models.dtos.DmActivityDto;
import net.ent.etnc.chattangzer.models.dtos.DmDto;
import net.ent.etnc.chattangzer.models.dtos.MessageDto;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.UnreadDto;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DirectMessageServiceTest {

    @Autowired
    private DirectMessageService dmService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ChannelService channelService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User alice;
    private User bob;
    private User carol;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(new User("alice", "Alice", "x"));
        bob = userRepository.save(new User("bob", "Bob", "x"));
        carol = userRepository.save(new User("carol", "Carol", "x"));
    }

    private MessageDto send(User author, Long channelId, String content) {
        return messageService.send(channelId, author.getId(), new MessageRequests.Send(content, null, null));
    }

    @Test
    void thereIsOnlyOneConversationPerPair() {
        DmDto fromAlice = dmService.open(alice.getId(), bob.getId());
        DmDto fromBob = dmService.open(bob.getId(), alice.getId());

        assertThat(fromBob.channelId()).isEqualTo(fromAlice.channelId());
        assertThat(fromAlice.otherUser().username()).isEqualTo("bob");
        assertThat(fromBob.otherUser().username()).isEqualTo("alice");
    }

    @Test
    void cannotWriteToYourself() {
        assertThatThrownBy(() -> dmService.open(alice.getId(), alice.getId()))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> dmService.open(alice.getId(), 999_999L))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void onlyTheTwoParticipantsCanReadOrWrite() {
        Long channelId = dmService.open(alice.getId(), bob.getId()).channelId();
        send(alice, channelId, "Juste entre nous");

        assertThat(messageService.history(channelId, bob.getId(), null, null))
                .extracting("content").containsExactly("Juste entre nous");
        assertThatThrownBy(() -> messageService.history(channelId, carol.getId(), null, null))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        assertThatThrownBy(() -> send(carol, channelId, "intrus"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void nobodyModeratesAPrivateConversation() {
        Long channelId = dmService.open(alice.getId(), bob.getId()).channelId();
        MessageDto message = send(alice, channelId, "à moi");

        assertThatThrownBy(() -> messageService.delete(message.id(), bob.getId()))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> channelService.update(channelId, alice.getId(), new ChannelRequest("renommé", null, null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void conversationsAreSortedByLastMessageWithPreviewAndUnread() {
        Long withBob = dmService.open(alice.getId(), bob.getId()).channelId();
        Long withCarol = dmService.open(alice.getId(), carol.getId()).channelId();

        send(carol, withCarol, "Coucou Alice");
        send(bob, withBob, "Message de Bob");
        send(bob, withBob, "Encore Bob");

        List<DmDto> conversations = dmService.list(alice.getId());

        assertThat(conversations).extracting("channelId").containsExactly(withBob, withCarol);
        assertThat(conversations.getFirst().lastMessage().content()).isEqualTo("Encore Bob");
        assertThat(conversations.getFirst().unreadCount()).isEqualTo(2);
        assertThat(messageService.unread(alice.getId()))
                .contains(new UnreadDto(withBob, null, 2), new UnreadDto(withCarol, null, 1));
    }

    @Test
    void bothParticipantsAreNotifiedOfNewMessages() {
        Long channelId = dmService.open(alice.getId(), bob.getId()).channelId();

        MessageDto message = send(alice, channelId, "Tu es là ?");

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(realtime).toUser(eq("bob"), eq("DM_ACTIVITY"), payload.capture());
        verify(realtime).toUser(eq("alice"), eq("DM_ACTIVITY"), any());
        DmActivityDto activity = (DmActivityDto) payload.getValue();
        assertThat(activity.message().id()).isEqualTo(message.id());
        assertThat(activity.participants()).extracting("username").containsExactly("alice", "bob");
    }

    @Test
    void readingShowsSeenToTheOtherParticipant() {
        Long channelId = dmService.open(alice.getId(), bob.getId()).channelId();
        MessageDto message = send(alice, channelId, "Tu as vu ?");

        messageService.markRead(channelId, bob.getId(), message.id());

        verify(realtime).toChannel(channelId, "READ",
                Map.of("channelId", channelId, "userId", bob.getId(), "lastReadMessageId", message.id()));
        assertThat(dmService.list(alice.getId()).getFirst().otherLastReadMessageId()).isEqualTo(message.id());
    }

    @Test
    void usersCanBeSearchedByNameOrUsername() {
        assertThat(userService.search("BO")).extracting("username").containsExactly("bob");
        assertThat(userService.search("")).hasSizeGreaterThanOrEqualTo(3);
    }
}
