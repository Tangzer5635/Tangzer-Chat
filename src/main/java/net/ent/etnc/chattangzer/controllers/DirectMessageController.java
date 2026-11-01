package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.DmDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.DirectMessageService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * GET  /api/dms              mes conversations privées
 * POST /api/dms {"userId"}   ouvrir (ou créer) la conversation avec quelqu'un
 * Les messages passent ensuite par /api/channels/{channelId}/messages.
 */
@RestController
@RequestMapping("/api/dms")
public class DirectMessageController {

    private final DirectMessageService directMessageService;

    public DirectMessageController(DirectMessageService directMessageService) {
        this.directMessageService = directMessageService;
    }

    @GetMapping
    public List<DmDto> list(@AuthenticationPrincipal AuthUser me) {
        return directMessageService.list(me.id());
    }

    @PostMapping
    public DmDto open(@RequestBody OpenRequest request, @AuthenticationPrincipal AuthUser me) {
        return directMessageService.open(me.id(), request.userId());
    }

    public record OpenRequest(Long userId) {}
}
