package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.ProfileRequests;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.models.entities.UserStatus;
import net.ent.etnc.chattangzer.repositories.AttachmentRepository;
import net.ent.etnc.chattangzer.repositories.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_.]{3,20}$");
    public static final int PASSWORD_MIN_LENGTH = 6;
    /** BCrypt ignore tout ce qui dépasse 72 octets. */
    public static final int PASSWORD_MAX_LENGTH = 72;
    public static final int DISPLAY_NAME_MAX_LENGTH = 32;
    public static final int BIO_MAX_LENGTH = 190;
    /** Clair, sombre, ou selon le réglage de l'appareil. */
    public static final Set<String> THEMES = Set.of("light", "dark", "system");
    public static final int FONT_SIZE_MIN = 12;
    public static final int FONT_SIZE_MAX = 20;
    private static final Pattern COLOR_PATTERN = Pattern.compile("^#[0-9a-fA-F]{6}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ServerService serverService;
    private final PresenceService presenceService;
    private final AttachmentRepository attachmentRepository;
    private final RealtimeService realtime;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ServerService serverService,
            PresenceService presenceService,
            AttachmentRepository attachmentRepository,
            RealtimeService realtime
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.serverService = serverService;
        this.presenceService = presenceService;
        this.attachmentRepository = attachmentRepository;
        this.realtime = realtime;
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
        validatePassword(password);

        String displayName = normalizeDisplayName(rawDisplayName, username);

        if (userRepository.existsByUsername(username)) {
            throw ApiException.conflict("Ce nom d'utilisateur est déjà pris");
        }

        User user = userRepository.save(new User(username, displayName, passwordEncoder.encode(password)));
        // Tout nouvel inscrit arrive sur le serveur public par défaut.
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

    /** Nom affiché, bio, couleur de bannière, photo de profil. Les autres voient le changement en direct. */
    @Transactional
    public User updateProfile(Long userId, ProfileRequests.Profile request) {
        User user = getById(userId);

        if (request.displayName() != null) {
            user.setDisplayName(normalizeDisplayName(request.displayName(), user.getUsername()));
        }
        if (request.bio() != null) {
            String bio = request.bio().strip();
            if (Texts.length(bio) > BIO_MAX_LENGTH) {
                throw ApiException.badRequest("La bio ne doit pas dépasser " + BIO_MAX_LENGTH + " caractères");
            }
            user.setBio(bio.isEmpty() ? null : bio);
        }
        if (request.bannerColor() != null) {
            user.setBannerColor(normalizeOptionalColor(request.bannerColor()));
        }
        if (request.avatarId() != null) {
            user.setAvatarId(request.avatarId().isBlank() ? null : requireOwnImage(userId, request.avatarId()));
        }

        realtime.toTopic("/topic/users", "USER_UPDATED", UserDto.from(user));
        return user;
    }

    /** Thème, taille du texte, mode compact. */
    @Transactional
    public User updatePreferences(Long userId, ProfileRequests.Preferences request) {
        User user = getById(userId);

        if (request.theme() != null) {
            if (!THEMES.contains(request.theme())) {
                throw ApiException.badRequest("Thème inconnu");
            }
            user.setTheme(request.theme());
        }
        if (request.fontSize() != null) {
            if (request.fontSize() < FONT_SIZE_MIN || request.fontSize() > FONT_SIZE_MAX) {
                throw ApiException.badRequest("La taille du texte va de " + FONT_SIZE_MIN + " à " + FONT_SIZE_MAX + " px");
            }
            user.setFontSize(request.fontSize());
        }
        if (request.compact() != null) {
            user.setCompact(request.compact());
        }
        return user;
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = getById(userId);
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw ApiException.badRequest("Le mot de passe actuel est incorrect");
        }
        validatePassword(newPassword);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    /** Une image que j'ai envoyée et qui n'est pas déjà dans un message. */
    private String requireOwnImage(Long userId, String attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .filter(a -> a.getUploaderId().equals(userId) && a.getMessageId() == null)
                .orElseThrow(() -> ApiException.badRequest("Cette image n'est pas disponible, renvoie-la"))
                .getId();
    }

    private static void validatePassword(String password) {
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
            throw ApiException.badRequest(
                    "Le mot de passe doit faire au moins " + PASSWORD_MIN_LENGTH + " caractères");
        }
        if (password.length() > PASSWORD_MAX_LENGTH) {
            throw ApiException.badRequest("Le mot de passe est trop long");
        }
    }

    /** "#AABBCC" → "#aabbcc", "" → null (couleur par défaut). */
    static String normalizeOptionalColor(String raw) {
        String color = raw.strip();
        if (color.isEmpty()) {
            return null;
        }
        if (!COLOR_PATTERN.matcher(color).matches()) {
            throw ApiException.badRequest("La couleur doit être au format #rrggbb");
        }
        return color.toLowerCase(Locale.ROOT);
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
