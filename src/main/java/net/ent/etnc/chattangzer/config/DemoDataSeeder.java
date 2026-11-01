package net.ent.etnc.chattangzer.config;

import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crée les comptes de démonstration s'ils n'existent pas encore.
 * Désactivable avec APP_DEMO_DATA=false.
 */
@Component
@ConditionalOnProperty(name = "app.demo-data", havingValue = "true", matchIfMissing = true)
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private record DemoUser(String username, String displayName, String password) {}

    private static final DemoUser[] DEMO_USERS = {
            new DemoUser("admin", "Admin", "admin"),
            new DemoUser("user", "User", "user"),
            new DemoUser("tanguy", "Tanguy", "1234"),
            new DemoUser("pigloo", "Pigloo", "127845"),
    };

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (DemoUser demo : DEMO_USERS) {
            if (!userRepository.existsByUsername(demo.username())) {
                userRepository.save(new User(demo.username(), demo.displayName(), passwordEncoder.encode(demo.password())));
                log.info("Compte de démonstration créé : {}", demo.username());
            }
        }
    }
}
