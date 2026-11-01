package net.ent.etnc.chattangzer.config;

import net.ent.etnc.chattangzer.models.entities.MemberRole;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.UserRepository;
import net.ent.etnc.chattangzer.services.RealtimeService;
import net.ent.etnc.chattangzer.services.ServerService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DefaultServerInitializerTest {

    @Autowired
    private DefaultServerInitializer initializer;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServerService serverService;

    @MockitoBean
    private RealtimeService realtime;

    @Test
    void existingAccountsJoinTheDefaultServerCreatedByTheOldestOne() {
        User oldest = userRepository.save(new User("ancien", "Ancien", "x"));
        User newer = userRepository.save(new User("recent", "Récent", "x"));

        initializer.run(null);
        initializer.run(null); // relancer ne change rien

        assertThat(serverService.listForUser(oldest.getId()))
                .singleElement()
                .satisfies(server -> {
                    assertThat(server.isDefault()).isTrue();
                    assertThat(server.myRole()).isEqualTo(MemberRole.OWNER);
                    assertThat(server.memberCount()).isEqualTo(2);
                });
        assertThat(serverService.listForUser(newer.getId()).getFirst().myRole()).isEqualTo(MemberRole.MEMBER);
    }
}
