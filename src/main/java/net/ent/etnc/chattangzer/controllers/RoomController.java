package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.ChatMessage;
import net.ent.etnc.chattangzer.models.dtos.MessageType;
import net.ent.etnc.chattangzer.services.RoomService;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;

@Controller
public class RoomController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    public RoomController(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }


    @MessageMapping("/room/{id}/join")
    public void joinRoom(@DestinationVariable("id") String id, Principal user) {

        roomService.addMember(id, user.getName());

        ChatMessage joinMessage = new ChatMessage(MessageType.JOIN, user.getName() + " a rejoint", user.getName(), id);

        messagingTemplate.convertAndSend("/topic/room/" + id, joinMessage);
    }

    @MessageMapping("/room/{id}/send")
    public void sendRoomMessage(@DestinationVariable("id") String id, @Payload ChatMessage message, Principal user) {

        if (!roomService.isMember(id, user.getName())) {throw new AccessDeniedException("Vous n'êtes pas membre de ce salon");}
        message.setSender(user.getName());
        message.setType(MessageType.CHAT);
        message.setRoomId(id);
        message.setTimestamp(Instant.now());

        messagingTemplate.convertAndSend("/topic/room/" + id, message);
    }
}