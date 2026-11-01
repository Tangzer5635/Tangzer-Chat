package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.AccessService;
import net.ent.etnc.chattangzer.services.RealtimeService;
import net.ent.etnc.chattangzer.services.UserService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * « Machin est en train d'écrire… »
 * Client : SEND /app/channels/{id}/typing (au plus toutes les quelques secondes pendant la frappe).
 * Abonnés : /topic/channels/{id} reçoivent TYPING.
 */
@Controller
public class TypingController {

    private final AccessService accessService;
    private final UserService userService;
    private final RealtimeService realtime;

    public TypingController(AccessService accessService, UserService userService, RealtimeService realtime) {
        this.accessService = accessService;
        this.userService = userService;
        this.realtime = realtime;
    }

    @MessageMapping("/channels/{channelId}/typing")
    public void typing(@DestinationVariable Long channelId, Principal principal) {
        AuthUser me = AuthUser.from(principal);
        if (!accessService.canAccessChannel(channelId, me.id())) {
            return;
        }
        UserDto user = UserDto.from(userService.getById(me.id()));
        realtime.toChannel(channelId, "TYPING", Map.of("channelId", channelId, "user", user));
    }
}
