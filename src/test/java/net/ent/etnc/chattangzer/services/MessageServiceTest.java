package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ChannelActivityDto;
import net.ent.etnc.chattangzer.models.dtos.MessageDto;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.ReactionDto;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.dtos.UnreadDto;
import net.ent.etnc.chattangzer.models.entities.MemberRole;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MessageServiceTest {

    @Autowired
    private MessageService messageService;

    @Autowired
    private ServerService serverService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User owner;
    private User alice;
    private User stranger;
    private Long channelId;
    private Long serverId;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(new User("owner", "Owner", "x"));
        alice = userRepository.save(new User("alice", "Alice", "x"));
        stranger = userRepository.save(new User("stranger", "Stranger", "x"));
        ServerDto server = serverService.create(owner.getId(), new ServerRequest("Serveur", null, null, null, true));
        serverService.join(server.id(), alice.getId());
        serverId = server.id();
        channelId = server.channels().getFirst().id();
    }

    private MessageDto send(User author, String content) {
        return messageService.send(channelId, author.getId(), new MessageRequests.Send(content, null, null));
    }

    @Test
    void sentMessagesAreStoredAndBroadcast() {
        MessageDto sent = messageService.send(channelId, alice.getId(),
                new MessageRequests.Send("  Salut tout le monde  ", null, "nonce-123"));

        assertThat(sent.id()).isNotNull();
        assertThat(sent.content()).isEqualTo("Salut tout le monde");
        assertThat(sent.author().username()).isEqualTo("alice");
        assertThat(sent.nonce()).isEqualTo("nonce-123");
        verify(realtime).toChannel(eq(channelId), eq("MESSAGE_CREATED"), any(MessageDto.class));
    }

    @Test
    void historyIsChronologicalAndPaginated() {
        for (int i = 1; i <= 5; i++) {
            send(alice, "message " + i);
        }

        List<MessageDto> latest = messageService.history(channelId, owner.getId(), null, 2);
        assertThat(latest).extracting("content").containsExactly("message 4", "message 5");

        List<MessageDto> older = messageService.history(channelId, owner.getId(), latest.getFirst().id(), 10);
        assertThat(older).extracting("content").containsExactly("message 1", "message 2", "message 3");
    }

    @Test
    void strangersCanNeitherReadNorWrite() {
        assertThatThrownBy(() -> messageService.history(channelId, stranger.getId(), null, null))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        assertThatThrownBy(() -> send(stranger, "intrus"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void emptyOrTooLongMessagesAreRejected() {
        assertThatThrownBy(() -> send(alice, "   ")).hasMessageContaining("vide");
        assertThatThrownBy(() -> send(alice, "x".repeat(2001))).hasMessageContaining("2000");
    }

    @Test
    void repliesCarryAPreviewOfTheOriginal() {
        MessageDto original = send(owner, "Qui vient ce soir ?");

        MessageDto reply = messageService.send(channelId, alice.getId(),
                new MessageRequests.Send("Moi !", original.id(), null));

        assertThat(reply.replyTo().id()).isEqualTo(original.id());
        assertThat(reply.replyTo().author().username()).isEqualTo("owner");
        assertThat(reply.replyTo().content()).isEqualTo("Qui vient ce soir ?");
    }

    @Test
    void onlyTheAuthorEditsAMessage() {
        MessageDto message = send(alice, "Premier jet");

        assertThatThrownBy(() -> messageService.edit(message.id(), owner.getId(), "Piraté"))
                .isInstanceOf(ApiException.class);

        MessageDto edited = messageService.edit(message.id(), alice.getId(), "Version corrigée");
        assertThat(edited.content()).isEqualTo("Version corrigée");
        assertThat(edited.editedAt()).isNotNull();
    }

    @Test
    void authorsAndModeratorsCanDelete() {
        MessageDto byOwner = send(owner, "Message du propriétaire");
        MessageDto byAlice = send(alice, "Message d'Alice");
        MessageDto reply = messageService.send(channelId, owner.getId(),
                new MessageRequests.Send("Réponse", byAlice.id(), null));

        assertThatThrownBy(() -> messageService.delete(byOwner.id(), alice.getId()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);

        // Le propriétaire modère : il peut supprimer le message d'Alice.
        messageService.delete(byAlice.id(), owner.getId());

        List<MessageDto> history = messageService.history(channelId, owner.getId(), null, null);
        assertThat(history).extracting("id").containsExactly(byOwner.id(), reply.id());
        assertThat(history.get(1).replyTo()).isNull();
    }

    @Test
    void adminsCanAlsoModerate() {
        serverService.changeRole(serverId, owner.getId(), alice.getId(), MemberRole.ADMIN);
        MessageDto byOwner = send(owner, "à modérer");

        messageService.delete(byOwner.id(), alice.getId());

        assertThat(messageService.history(channelId, owner.getId(), null, null)).isEmpty();
    }

    @Test
    void reactionsToggleAndGroupByEmoji() {
        MessageDto message = send(owner, "Je paie ma tournée");

        messageService.toggleReaction(message.id(), alice.getId(), "🍻");
        messageService.toggleReaction(message.id(), owner.getId(), "🍻");
        List<ReactionDto> reactions = messageService.toggleReaction(message.id(), alice.getId(), "🎉");

        assertThat(reactions).extracting("emoji").containsExactly("🍻", "🎉");
        assertThat(reactions.getFirst().userIds()).containsExactly(alice.getId(), owner.getId());

        // Deuxième clic : la réaction est retirée.
        reactions = messageService.toggleReaction(message.id(), alice.getId(), "🍻");
        assertThat(reactions.getFirst().userIds()).containsExactly(owner.getId());

        assertThat(messageService.history(channelId, alice.getId(), null, null).getFirst().reactions())
                .hasSize(2);
        assertThatThrownBy(() -> messageService.toggleReaction(message.id(), alice.getId(), "  "))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void unreadCountsIgnoreMyOwnMessagesAndFollowReads() {
        send(owner, "un");
        MessageDto second = send(owner, "deux");

        assertThat(messageService.unread(alice.getId()))
                .singleElement()
                .isEqualTo(new UnreadDto(channelId, serverId, 2));
        // Ses propres messages ne comptent pas.
        assertThat(messageService.unread(owner.getId())).isEmpty();

        messageService.markRead(channelId, alice.getId(), second.id());
        assertThat(messageService.unread(alice.getId())).isEmpty();

        // Revenir en arrière n'a aucun effet.
        messageService.markRead(channelId, alice.getId(), 1L);
        assertThat(messageService.unread(alice.getId())).isEmpty();

        send(owner, "trois");
        assertThat(messageService.unread(alice.getId())).singleElement().extracting("count").isEqualTo(1L);

        // Répondre marque le salon comme lu pour son auteur.
        send(alice, "ma réponse");
        assertThat(messageService.unread(alice.getId())).isEmpty();
    }

    @Test
    void mentionsAreAnnouncedToTheServer() {
        send(alice, "Hé @Owner, tu viens ? et @owner encore");

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(realtime).toServer(eq(serverId), eq("CHANNEL_ACTIVITY"), payload.capture());
        ChannelActivityDto activity = (ChannelActivityDto) payload.getValue();
        assertThat(activity.channelId()).isEqualTo(channelId);
        assertThat(activity.authorId()).isEqualTo(alice.getId());
        assertThat(activity.mentions()).containsExactly("owner");
    }

    @Test
    void mentionsAreExtractedOnce() {
        assertThat(MessageService.extractMentions("@Tanguy @pigloo et @tanguy, mail@x"))
                .containsExactly("tanguy", "pigloo");
        assertThat(MessageService.extractMentions("pas de mention")).isEmpty();
    }
}
