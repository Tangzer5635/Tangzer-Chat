package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.exceptions.GlobalExceptionHandler.ErrorResponse;
import net.ent.etnc.chattangzer.models.dtos.ChannelMessageDto;
import net.ent.etnc.chattangzer.models.dtos.UserDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.AccessService;
import net.ent.etnc.chattangzer.services.RealtimeService;
import net.ent.etnc.chattangzer.services.UserService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

/**
 * Messages des salons, en temps réel (STOMP).
 * Client : SEND /app/channels/{id}/send {"content": "..."}
 * Abonnés : /topic/channels/{id} reçoivent MESSAGE_CREATED.
 */
@Controller
public class ChannelMessageController {

    public static final int CONTENT_MAX_LENGTH = 2000;

    private final AccessService accessService;
    private final UserService userService;
    private final RealtimeService realtime;

    public ChannelMessageController(AccessService accessService, UserService userService, RealtimeService realtime) {
        this.accessService = accessService;
        this.userService = userService;
        this.realtime = realtime;
    }

    public record SendRequest(String content) {}

    @MessageMapping("/channels/{channelId}/send")
    public void send(@DestinationVariable Long channelId, @Payload SendRequest request, Principal principal) {
        AuthUser me = AuthUser.from(principal);
        accessService.requireChannel(channelId, me.id());

        String content = request.content() == null ? "" : request.content().strip();
        if (content.isEmpty()) {
            return;
        }
        if (content.length() > CONTENT_MAX_LENGTH) {
            throw ApiException.badRequest("Un message ne doit pas dépasser " + CONTENT_MAX_LENGTH + " caractères");
        }

        UserDto author = UserDto.from(userService.getById(me.id()));
        realtime.toChannel(channelId, "MESSAGE_CREATED",
                new ChannelMessageDto(UUID.randomUUID().toString(), channelId, author, content, Instant.now()));
    }

    /** Les erreurs métier sont renvoyées à l'expéditeur sur /user/queue/errors. */
    @MessageExceptionHandler(ApiException.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public ErrorResponse handleError(ApiException e) {
        return new ErrorResponse(e.getMessage());
    }
}
