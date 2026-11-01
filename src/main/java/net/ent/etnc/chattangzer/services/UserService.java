package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_.]{3,20}$");
    public static final int PASSWORD_MIN_LENGTH = 6;
    /** BCrypt ignore tout ce qui dépasse 72 octets. */
    public static final int PASSWORD_MAX_LENGTH = 72;
    public static final int DISPLAY_NAME_MAX_LENGTH = 32;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ServerService serverService;
    private final PresenceService presenceService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ServerService serverService,
            PresenceService presenceService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.serverService = serverService;
        this.presenceService = presenceService;
    }

    /** "  Tanguy " devient "tanguy" : les usernames sont insensibles à la casse. */
    public static String normalizeUsername(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public User register(String rawUsername, String rawDisplayName, String password) {
        String username = normalizeUsername(rawUsername);

        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw ApiException.badRequest(
                    "Le nom d'utilisateur doit faire 3 à 20 caractères (lettres, chiffres, point ou tiret bas)");
        }
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
            throw ApiException.badRequest(
                    "Le mot de passe doit faire au moins " + PASSWORD_MIN_LENGTH + " caractères");
        }
        if (password.length() > PASSWORD_MAX_LENGTH) {
            throw ApiException.badRequest("Le mot de passe est trop long");
        }

        String displayName = normalizeDisplayName(rawDisplayName, username);

        if (userRepository.existsByUsername(username)) {
            throw ApiException.conflict("Ce nom d'utilisateur est déjà pris");
        }

        User user = userRepository.save(new User(username, displayName, passwordEncoder.encode(password)));
        // Tout nouvel inscrit arrive sur le serveur public de Tangzer.
        serverService.joinDefaultServer(user);
        return user;
    }

    /** Change mon statut (en ligne, inactif, ne pas déranger, invisible) et mon statut personnalisé. */
    @Transactional
    public User updateStatus(Long userId, UserStatus status, String rawCustomStatus) {
        if (status == null || status == UserStatus.OFFLINE) {
            throw ApiException.badRequest("Statut invalide");
        }
        User user = getById(userId);
        user.setStatus(status);
        user.setCustomStatus(Texts.optional(rawCustomStatus, 80, "Le statut personnalisé"));
        presenceService.preferenceChanged(userId, user.getStatus(), user.getCustomStatus());
        return user;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(normalizeUsername(username))
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }

    public List<User> listAll() {
        return userRepository.findAllByOrderByDisplayNameAsc();
    }

    /** Recherche par pseudo ou nom affiché (20 résultats maximum). */
    public List<User> search(String rawQuery) {
        String query = Texts.clean(rawQuery);
        return query.isEmpty()
                ? listAll().stream().limit(20).toList()
                : userRepository.findTop20ByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByDisplayNameAsc(query, query);
    }

    static String normalizeDisplayName(String raw, String fallback) {
        String displayName = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");

        if (displayName.isEmpty()) {
            return fallback;
        }
        if (displayName.length() > DISPLAY_NAME_MAX_LENGTH) {
            throw ApiException.badRequest(
                    "Le nom affiché ne doit pas dépasser " + DISPLAY_NAME_MAX_LENGTH + " caractères");
        }
        return displayName;
    }
}
