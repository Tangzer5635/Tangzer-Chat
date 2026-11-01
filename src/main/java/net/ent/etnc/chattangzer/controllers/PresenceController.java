package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.PresenceDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.PresenceService;

import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/**
 * GET  /api/presence                   qui est en ligne en ce moment
 * SEND /app/presence/idle {"idle": …}  l'onglet est (ou n'est plus) inactif
 * Les changements arrivent ensuite sur /topic/presence.
 */
@RestController
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @GetMapping("/api/presence")
    public List<PresenceDto> online() {
        return presenceService.snapshot();
    }

    public record IdleRequest(boolean idle) {}

    @MessageMapping("/presence/idle")
    public void idle(@Payload IdleRequest request, @Header("simpSessionId") String sessionId, Principal principal) {
        presenceService.setIdle(AuthUser.from(principal).id(), sessionId, request.idle());
    }
}
