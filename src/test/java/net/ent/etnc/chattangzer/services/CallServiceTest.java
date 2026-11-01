package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.CallDtos;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.ChannelType;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CallServiceTest {

    @Autowired
    private CallService callService;

    @Autowired
    private ServerService serverService;

    @Autowired
    private DirectMessageService dmService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private RealtimeService realtime;

    private User alice;
    private User bob;
    private User stranger;
    private Long serverId;
    private Long textChannelId;
    private Long voiceChannelId;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(new User("alice", "Alice", "x"));
        bob = userRepository.save(new User("bob", "Bob", "x"));
        stranger = userRepository.save(new User("stranger", "Stranger", "x"));
        ServerDto server = serverService.create(alice.getId(), new ServerRequest("Vocal", null, null, null, true));
        serverService.join(server.id(), bob.getId());
        serverId = server.id();
        textChannelId = server.channels().stream().filter(c -> c.type() == ChannelType.TEXT).findFirst().orElseThrow().id();
        voiceChannelId = server.channels().stream().filter(c -> c.type() == ChannelType.VOICE).findFirst().orElseThrow().id();
    }

    @AfterEach
    void tearDown() {
        // Les appels vivent en mémoire : on fait le ménage entre deux tests.
        callService.leave(alice.getId());
        callService.leave(bob.getId());
        callService.leave(stranger.getId());
    }

    @Test
    void joiningAVoiceChannelIsVisibleToTheWholeServer() {
        CallDtos.CallState state = callService.join(voiceChannelId, alice.getId(), "onglet-a", "session-a");

        assertThat(state.serverId()).isEqualTo(serverId);
        assertThat(state.participants()).extracting("user.username").containsExactly("alice");
        verify(realtime).toServer(eq(serverId), eq("CALL_STATE"), any(CallDtos.CallState.class));
        assertThat(callService.visibleCalls(bob.getId())).hasSize(1);
        assertThat(callService.visibleCalls(stranger.getId())).isEmpty();
    }

    @Test
    void callsHappenOnlyInVoiceChannelsOrDmsAndForMembers() {
        assertThatThrownBy(() -> callService.join(textChannelId, alice.getId(), "a", "s"))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
        assertThatThrownBy(() -> callService.join(voiceChannelId, stranger.getId(), "a", "s"))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void aUserIsInOneCallAtATime() {
        Long dmChannelId = dmService.open(alice.getId(), bob.getId()).channelId();
        callService.join(voiceChannelId, alice.getId(), "a", "s");

        callService.join(dmChannelId, alice.getId(), "a", "s");

        assertThat(callService.callOf(alice.getId())).contains(dmChannelId);
        assertThat(callService.visibleCalls(alice.getId()))
                .extracting("channelId").containsExactly(dmChannelId);
    }

    @Test
    void startingAPrivateCallRingsTheOtherPerson() {
        Long dmChannelId = dmService.open(alice.getId(), bob.getId()).channelId();

        callService.join(dmChannelId, alice.getId(), "a", "s-a");
        verify(realtime).toUser(eq("bob"), eq("INCOMING_CALL"), any(CallDtos.IncomingCall.class));

        callService.join(dmChannelId, bob.getId(), "b", "s-b");
        verify(realtime, never()).toUser(eq("alice"), eq("INCOMING_CALL"), any());
        assertThat(callService.visibleCalls(bob.getId()).getFirst().participants()).hasSize(2);
    }

    @Test
    void decliningWarnsTheCaller() {
        Long dmChannelId = dmService.open(alice.getId(), bob.getId()).channelId();
        callService.join(dmChannelId, alice.getId(), "a", "s-a");

        callService.decline(dmChannelId, bob.getId());

        verify(realtime).toUser(eq("alice"), eq("CALL_DECLINED"), any(CallDtos.Declined.class));
    }

    @Test
    void signalsAreRelayedOnlyBetweenParticipantsOfTheSameCall() {
        callService.join(voiceChannelId, alice.getId(), "onglet-alice", "s-a");

        CallDtos.SignalRequest offer = new CallDtos.SignalRequest(voiceChannelId, bob.getId(), "offer", Map.of("sdp", "…"));
        assertThatThrownBy(() -> callService.relay(alice.getId(), offer)).isInstanceOf(ApiException.class);

        callService.join(voiceChannelId, bob.getId(), "onglet-bob", "s-b");
        callService.relay(alice.getId(), offer);

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(realtime).toUserCalls(eq("bob"), eq("CALL_SIGNAL"), payload.capture());
        CallDtos.Signal signal = (CallDtos.Signal) payload.getValue();
        assertThat(signal.fromUserId()).isEqualTo(alice.getId());
        assertThat(signal.toClientId()).isEqualTo("onglet-bob");

        assertThatThrownBy(() -> callService.relay(alice.getId(),
                new CallDtos.SignalRequest(voiceChannelId, bob.getId(), "pirate", null)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void closingTheTabLeavesTheCall() {
        callService.join(voiceChannelId, alice.getId(), "a", "session-a");
        callService.join(voiceChannelId, bob.getId(), "b", "session-b");

        callService.leaveSession("session-a");

        assertThat(callService.callOf(alice.getId())).isEmpty();
        assertThat(callService.visibleCalls(bob.getId()).getFirst().participants())
                .extracting("user.username").containsExactly("bob");

        callService.leaveSession("session-b");
        assertThat(callService.visibleCalls(bob.getId())).isEmpty();
    }

    @Test
    void microphoneStateIsShared() {
        callService.join(voiceChannelId, alice.getId(), "a", "s");

        callService.updateState(alice.getId(), new CallDtos.StateRequest(true, false, false, false));

        assertThat(callService.visibleCalls(bob.getId()).getFirst().participants().getFirst().muted()).isTrue();
    }

    @Test
    void cameraAndScreenSharingAreShared() {
        callService.join(voiceChannelId, alice.getId(), "a", "s");

        callService.updateState(alice.getId(), new CallDtos.StateRequest(false, false, true, true));

        CallDtos.Participant participant = callService.visibleCalls(bob.getId()).getFirst().participants().getFirst();
        assertThat(participant.video()).isTrue();
        assertThat(participant.screen()).isTrue();
    }

    @Test
    void noMessagesInAVoiceChannel() {
        assertThatThrownBy(() -> messageService.send(voiceChannelId, alice.getId(),
                new MessageRequests.Send("allô ?", null, null)))
                .hasMessageContaining("vocal");
    }
}
