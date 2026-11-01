package net.ent.etnc.chattangzer.controllers.security;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.models.entities.User;
import net.ent.etnc.chattangzer.security.jwt.JwtUtils;
import net.ent.etnc.chattangzer.services.UserService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * POST /api/auth/register  {"username", "displayName", "password"}
 * POST /api/auth/login     {"username", "password"}
 * Les deux renvoient {"token": "eyJ...", "user": {...}}.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request.username(), request.displayName(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse(user));
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        String username = UserService.normalizeUsername(request.username());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.password())
            );
        } catch (AuthenticationException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Identifiant ou mot de passe incorrect");
        }
        return authResponse(userService.getByUsername(username));
    }

    private AuthResponse authResponse(User user) {
        return new AuthResponse(jwtUtils.generateToken(user.getUsername()), UserDto.from(user));
    }

    public record RegisterRequest(String username, String displayName, String password) {}

    public record LoginRequest(String username, String password) {}

    public record AuthResponse(String token, UserDto user) {}
}
