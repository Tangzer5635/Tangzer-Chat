package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.InvitePreviewDto;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.InviteService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final InviteService inviteService;

    public InviteController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    @GetMapping("/{code}")
    public InvitePreviewDto preview(@PathVariable String code, @AuthenticationPrincipal AuthUser me) {
        return inviteService.preview(code, me.id());
    }

    @PostMapping("/{code}/accept")
    public ServerDto accept(@PathVariable String code, @AuthenticationPrincipal AuthUser me) {
        return inviteService.accept(code, me.id());
    }
}
