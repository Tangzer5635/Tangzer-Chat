package net.ent.etnc.chattangzer.config;

import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.repositories.ServerRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;
import net.ent.etnc.chattangzer.services.ServerService;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Au démarrage, si le serveur public « Tangzer » n'existe pas encore alors que
 * des comptes existent (base créée avant les serveurs), on le crée : le plus
 * ancien compte en devient propriétaire et tous les autres le rejoignent.
 */
@Component
@Order(2)
public class DefaultServerInitializer implements ApplicationRunner {

    private final ServerRepository serverRepository;
    private final UserRepository userRepository;
    private final ServerService serverService;

    public DefaultServerInitializer(
            ServerRepository serverRepository,
            UserRepository userRepository,
            ServerService serverService
    ) {
        this.serverRepository = serverRepository;
        this.userRepository = userRepository;
        this.serverService = serverService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (serverRepository.findFirstByDefaultServerTrue().isPresent()) {
            return;
        }
        for (User user : userRepository.findAll(Sort.by("createdAt", "id"))) {
            serverService.joinDefaultServer(user);
        }
    }
}
