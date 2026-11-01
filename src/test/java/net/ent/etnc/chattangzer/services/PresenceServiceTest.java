package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.models.dtos.PresenceDto;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PresenceServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final SimpMessagingTemplate messaging = mock(SimpMessagingTemplate.class);
    private final PresenceService presence = new PresenceService(userRepository, messaging);

    @BeforeEach
    void setUp() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(new User("x", "X", "x")));
    }

    @Test
    void effectiveStatusRules() {
        assertThat(PresenceService.effectiveStatus(UserStatus.ONLINE, List.of())).isEqualTo(UserStatus.OFFLINE);
        assertThat(PresenceService.effectiveStatus(UserStatus.ONLINE, List.of(false))).isEqualTo(UserStatus.ONLINE);
        assertThat(PresenceService.effectiveStatus(UserStatus.ONLINE, List.of(true, true))).isEqualTo(UserStatus.IDLE);
        assertThat(PresenceService.effectiveStatus(UserStatus.ONLINE, List.of(true, false))).isEqualTo(UserStatus.ONLINE);
        assertThat(PresenceService.effectiveStatus(UserStatus.DND, List.of(true))).isEqualTo(UserStatus.DND);
        assertThat(PresenceService.effectiveStatus(UserStatus.IDLE, List.of(false))).isEqualTo(UserStatus.IDLE);
        assertThat(PresenceService.effectiveStatus(UserStatus.INVISIBLE, List.of(false))).isEqualTo(UserStatus.OFFLINE);
    }

    @Test
    void severalTabsKeepTheUserOnlineUntilTheLastOneCloses() {
        presence.sessionOpened(1L, "onglet-1");
        presence.sessionOpened(1L, "onglet-2");
        verify(messaging).convertAndSend("/topic/presence", new PresenceDto(1L, UserStatus.ONLINE, null));

        clearInvocations(messaging);
        presence.sessionClosed(1L, "onglet-1");
        verify(messaging, never()).convertAndSend(eq("/topic/presence"), any(Object.class));
        assertThat(presence.statusOf(1L)).isEqualTo(UserStatus.ONLINE);

        presence.sessionClosed(1L, "onglet-2");
        verify(messaging).convertAndSend("/topic/presence", new PresenceDto(1L, UserStatus.OFFLINE, null));
        assertThat(presence.snapshot()).isEmpty();
    }

    @Test
    void theUserIsIdleOnlyWhenEveryTabIsIdle() {
        presence.sessionOpened(1L, "a");
        presence.sessionOpened(1L, "b");

        presence.setIdle(1L, "a", true);
        assertThat(presence.statusOf(1L)).isEqualTo(UserStatus.ONLINE);

        presence.setIdle(1L, "b", true);
        assertThat(presence.statusOf(1L)).isEqualTo(UserStatus.IDLE);

        presence.setIdle(1L, "a", false);
        assertThat(presence.statusOf(1L)).isEqualTo(UserStatus.ONLINE);
    }

    @Test
    void invisibleUsersLookOfflineAndHideTheirCustomStatus() {
        presence.sessionOpened(1L, "a");
        presence.preferenceChanged(1L, UserStatus.INVISIBLE, "🕵️ discret");

        assertThat(presence.statusOf(1L)).isEqualTo(UserStatus.OFFLINE);
        assertThat(presence.snapshot()).isEmpty();
        verify(messaging).convertAndSend("/topic/presence", new PresenceDto(1L, UserStatus.OFFLINE, null));
    }

    @Test
    void customStatusIsSharedWhileOnline() {
        presence.sessionOpened(2L, "a");
        presence.preferenceChanged(2L, UserStatus.DND, "🎮 En partie");

        assertThat(presence.snapshot()).containsExactly(new PresenceDto(2L, UserStatus.DND, "🎮 En partie"));
    }
}
