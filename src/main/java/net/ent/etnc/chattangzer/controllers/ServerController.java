package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.ChannelDto;
import net.ent.etnc.chattangzer.models.dtos.ChannelRequest;
import net.ent.etnc.chattangzer.models.dtos.DiscoverServerDto;
import net.ent.etnc.chattangzer.models.dtos.InviteDto;
import net.ent.etnc.chattangzer.models.dtos.InviteRequest;
import net.ent.etnc.chattangzer.models.dtos.MemberDto;
import net.ent.etnc.chattangzer.models.dtos.ServerDto;
import net.ent.etnc.chattangzer.models.dtos.ServerRequest;
import net.ent.etnc.chattangzer.models.entities.MemberRole;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.ChannelService;
import net.ent.etnc.chattangzer.services.InviteService;
import net.ent.etnc.chattangzer.services.ServerService;

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

@RestController
@RequestMapping("/api/servers")
public class ServerController {

    private final ServerService serverService;
    private final ChannelService channelService;
    private final InviteService inviteService;

    public ServerController(ServerService serverService, ChannelService channelService, InviteService inviteService) {
        this.serverService = serverService;
        this.channelService = channelService;
        this.inviteService = inviteService;
    }

    /** Mes serveurs, avec leurs salons. */
    @GetMapping
    public List<ServerDto> myServers(@AuthenticationPrincipal AuthUser me) {
        return serverService.listForUser(me.id());
    }

    /** Serveurs publics (page Explorer), filtrés par ?q=. */
    @GetMapping("/discover")
    public List<DiscoverServerDto> discover(
            @RequestParam(name = "q", required = false) String query,
            @AuthenticationPrincipal AuthUser me
    ) {
        return serverService.discover(query, me.id());
    }

    @PostMapping
    public ResponseEntity<ServerDto> create(@RequestBody ServerRequest request, @AuthenticationPrincipal AuthUser me) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serverService.create(me.id(), request));
    }

    @GetMapping("/{serverId}")
    public ServerDto get(@PathVariable Long serverId, @AuthenticationPrincipal AuthUser me) {
        return serverService.get(serverId, me.id());
    }

    @PatchMapping("/{serverId}")
    public ServerDto update(
            @PathVariable Long serverId,
            @RequestBody ServerRequest request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return serverService.update(serverId, me.id(), request);
    }

    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> delete(@PathVariable Long serverId, @AuthenticationPrincipal AuthUser me) {
        serverService.delete(serverId, me.id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{serverId}/join")
    public ServerDto join(@PathVariable Long serverId, @AuthenticationPrincipal AuthUser me) {
        return serverService.join(serverId, me.id());
    }

    @PostMapping("/{serverId}/leave")
    public ResponseEntity<Void> leave(@PathVariable Long serverId, @AuthenticationPrincipal AuthUser me) {
        serverService.leave(serverId, me.id());
        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------------- Membres

    @GetMapping("/{serverId}/members")
    public List<MemberDto> members(@PathVariable Long serverId, @AuthenticationPrincipal AuthUser me) {
        return serverService.listMembers(serverId, me.id());
    }

    @DeleteMapping("/{serverId}/members/{userId}")
    public ResponseEntity<Void> kick(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            @AuthenticationPrincipal AuthUser me
    ) {
        serverService.kick(serverId, me.id(), userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{serverId}/members/{userId}")
    public MemberDto changeRole(
            @PathVariable Long serverId,
            @PathVariable Long userId,
            @RequestBody RoleRequest request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return serverService.changeRole(serverId, me.id(), userId, request.role());
    }

    public record RoleRequest(MemberRole role) {}

    // ---------------------------------------------------------- Salons, invitations

    @PostMapping("/{serverId}/channels")
    public ResponseEntity<ChannelDto> createChannel(
            @PathVariable Long serverId,
            @RequestBody ChannelRequest request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(channelService.create(serverId, me.id(), request));
    }

    @PostMapping("/{serverId}/invites")
    public ResponseEntity<InviteDto> createInvite(
            @PathVariable Long serverId,
            @RequestBody(required = false) InviteRequest request,
            @AuthenticationPrincipal AuthUser me
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inviteService.create(serverId, me.id(), request));
    }
}
