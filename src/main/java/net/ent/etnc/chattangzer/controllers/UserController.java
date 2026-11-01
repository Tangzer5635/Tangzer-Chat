package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.MeDto;
import net.ent.etnc.chattangzer.models.dtos.ProfileDto;
import net.ent.etnc.chattangzer.models.dtos.ProfileRequests;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.UserStatus;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Utilisateur connecté : permet au front de restaurer la session au rechargement. */
    @GetMapping("/me")
    public MeDto me(@AuthenticationPrincipal AuthUser me) {
        return MeDto.from(userService.getById(me.id()));
    }

    @PutMapping("/me/status")
    public MeDto updateStatus(@RequestBody StatusRequest request, @AuthenticationPrincipal AuthUser me) {
        return MeDto.from(userService.updateStatus(me.id(), request.status(), request.customStatus()));
    }

    public record StatusRequest(UserStatus status, String customStatus) {}

    /** Nom affiché, bio, couleur de bannière, photo de profil. */
    @PatchMapping("/me")
    public MeDto updateProfile(@RequestBody ProfileRequests.Profile request, @AuthenticationPrincipal AuthUser me) {
        return MeDto.from(userService.updateProfile(me.id(), request));
    }

    /** Thème, couleur d'accent, taille du texte, mode compact. */
    @PutMapping("/me/preferences")
    public MeDto updatePreferences(@RequestBody ProfileRequests.Preferences request, @AuthenticationPrincipal AuthUser me) {
        return MeDto.from(userService.updatePreferences(me.id(), request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@RequestBody ProfileRequests.Password request, @AuthenticationPrincipal AuthUser me) {
        userService.changePassword(me.id(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/profile")
    public ProfileDto profile(@PathVariable Long userId) {
        return ProfileDto.from(userService.getById(userId));
    }

    /** Recherche d'utilisateurs (?search=), pour démarrer une conversation privée. */
    @GetMapping
    public List<UserDto> search(@RequestParam(required = false) String search) {
        return userService.search(search).stream().map(UserDto::from).toList();
    }
}
