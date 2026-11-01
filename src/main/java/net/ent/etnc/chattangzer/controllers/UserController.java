package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.UserService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
    public UserDto me(@AuthenticationPrincipal AuthUser me) {
        return UserDto.from(userService.getById(me.id()));
    }

    /** Recherche d'utilisateurs (?search=), pour démarrer une conversation privée. */
    @GetMapping
    public List<UserDto> search(@RequestParam(required = false) String search) {
        return userService.search(search).stream().map(UserDto::from).toList();
    }
}
