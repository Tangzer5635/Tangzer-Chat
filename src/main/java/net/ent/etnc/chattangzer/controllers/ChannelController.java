package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.ChannelDto;
import net.ent.etnc.chattangzer.models.dtos.ChannelRequest;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.ChannelService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/channels")
public class ChannelController {

    private final ChannelService channelService;

    public ChannelController(ChannelService channelService) {
        this.channelService = channelService;
    }

    @PatchMapping("/{channelId}")
    public ChannelDto update(
            @PathVariable Long channelId,
            @RequestBody ChannelRequest request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return channelService.update(channelId, me.id(), request);
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> delete(@PathVariable Long channelId, @AuthenticationPrincipal AuthUser me) {
        channelService.delete(channelId, me.id());
        return ResponseEntity.noContent().build();
    }
}
