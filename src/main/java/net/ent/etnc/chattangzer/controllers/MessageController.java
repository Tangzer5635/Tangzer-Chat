package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.MessageDto;
import net.ent.etnc.chattangzer.models.dtos.MessageRequests;
import net.ent.etnc.chattangzer.models.dtos.ReactionDto;
import net.ent.etnc.chattangzer.models.dtos.UnreadDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.MessageService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Messages : on écrit en REST, les autres membres reçoivent les
 * changements en temps réel sur /topic/channels/{id}.
 */
@RestController
@RequestMapping("/api")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    /** Historique : ?before={id} pour remonter dans le temps. */
    @GetMapping("/channels/{channelId}/messages")
    public List<MessageDto> history(
            @PathVariable Long channelId,
            @RequestParam(required = false) Long before,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal AuthUser me
    ) {
        return messageService.history(channelId, me.id(), before, limit);
    }

    @PostMapping("/channels/{channelId}/messages")
    public ResponseEntity<MessageDto> send(
            @PathVariable Long channelId,
            @RequestBody MessageRequests.Send request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.send(channelId, me.id(), request));
    }

    @PatchMapping("/messages/{messageId}")
    public MessageDto edit(
            @PathVariable Long messageId,
            @RequestBody MessageRequests.Edit request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return messageService.edit(messageId, me.id(), request.content());
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> delete(@PathVariable Long messageId, @AuthenticationPrincipal AuthUser me) {
        messageService.delete(messageId, me.id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/messages/{messageId}/reactions")
    public List<ReactionDto> react(
            @PathVariable Long messageId,
            @RequestBody MessageRequests.React request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return messageService.toggleReaction(messageId, me.id(), request.emoji());
    }

    @PostMapping("/channels/{channelId}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long channelId,
            @RequestBody MessageRequests.Read request,
            @AuthenticationPrincipal AuthUser me
    ) {
        messageService.markRead(channelId, me.id(), request.messageId());
        return ResponseEntity.noContent().build();
    }

    /** Non-lus de tous mes salons. */
    @GetMapping("/unread")
    public List<UnreadDto> unread(@AuthenticationPrincipal AuthUser me) {
        return messageService.unread(me.id());
    }
}
