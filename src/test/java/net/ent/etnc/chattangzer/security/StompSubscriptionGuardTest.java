package net.ent.etnc.chattangzer.security;

import net.ent.etnc.chattangzer.services.AccessService;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StompSubscriptionGuardTest {

    private final AccessService accessService = mock(AccessService.class);
    private final StompSubscriptionGuard guard = new StompSubscriptionGuard(accessService);

    @Test
    void personalQueuesAndPresenceAreAllowed() {
        assertThat(guard.isAllowed("/user/queue/events", 1L)).isTrue();
        assertThat(guard.isAllowed("/topic/presence", 1L)).isTrue();
    }

    @Test
    void channelTopicRequiresAccess() {
        when(accessService.canAccessChannel(10L, 1L)).thenReturn(true);

        assertThat(guard.isAllowed("/topic/channels/10", 1L)).isTrue();
        assertThat(guard.isAllowed("/topic/channels/10", 2L)).isFalse();
    }

    @Test
    void serverTopicRequiresMembership() {
        when(accessService.isMember(5L, 1L)).thenReturn(true);

        assertThat(guard.isAllowed("/topic/servers/5", 1L)).isTrue();
        assertThat(guard.isAllowed("/topic/servers/5", 2L)).isFalse();
    }

    @Test
    void anyOtherDestinationIsRefused() {
        assertThat(guard.isAllowed("/topic/public", 1L)).isFalse();
        assertThat(guard.isAllowed("/topic/channels/abc", 1L)).isFalse();
        assertThat(guard.isAllowed("/topic/servers/5/../../channels/1", 1L)).isFalse();
    }
}
