package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.exceptions.ApiException;
import net.ent.etnc.chattangzer.exceptions.GlobalExceptionHandler.ErrorResponse;
import net.ent.etnc.chattangzer.models.dtos.CallDtos;
import net.ent.etnc.chattangzer.security.AuthUser;
import net.ent.etnc.chattangzer.services.CallService;
import net.ent.etnc.chattangzer.services.RealtimeService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Appels : tout passe par STOMP, sauf la lecture de l'état initial.
 *
 * SEND /app/calls/{channelId}/join {clientId}   rejoindre (réponse CALL_JOINED sur /user/queue/calls)
 * SEND /app/calls/leave                          quitter
 * SEND /app/calls/state {muted, deafened, …}     micro, casque, caméra
 * SEND /app/calls/signal {channelId, toUserId…}  message WebRTC pour un autre participant
 * SEND /app/calls/{channelId}/decline            refuser un appel privé
 * GET  /api/calls                                appels en cours visibles
 * GET  /api/calls/ice-servers                    serveurs STUN/TURN
 */
@RestController
public class CallController {

    private final CallService callService;
    private final RealtimeService realtime;
    private final List<CallDtos.IceServer> iceServers;

    public CallController(
            CallService callService,
            RealtimeService realtime,
            @Value("${app.webrtc.stun-urls}") String stunUrls,
            @Value("${app.webrtc.turn-url:}") String turnUrl,
            @Value("${app.webrtc.turn-username:}") String turnUsername,
            @Value("${app.webrtc.turn-credential:}") String turnCredential
    ) {
        this.callService = callService;
        this.realtime = realtime;

        List<CallDtos.IceServer> servers = new ArrayList<>();
        List<String> stun = Arrays.stream(stunUrls.split(",")).map(String::strip).filter(s -> !s.isEmpty()).toList();
        if (!stun.isEmpty()) {
            servers.add(new CallDtos.IceServer(stun, null, null));
        }
        if (!turnUrl.isBlank()) {
            servers.add(new CallDtos.IceServer(List.of(turnUrl.strip()), turnUsername, turnCredential));
        }
        this.iceServers = List.copyOf(servers);
    }

    @GetMapping("/api/calls")
    public List<CallDtos.CallState> visibleCalls(@AuthenticationPrincipal AuthUser me) {
        return callService.visibleCalls(me.id());
    }

    @GetMapping("/api/calls/ice-servers")
    public List<CallDtos.IceServer> iceServers() {
        return iceServers;
    }

    @MessageMapping("/calls/{channelId}/join")
    public void join(
            @DestinationVariable Long channelId,
            @Payload CallDtos.JoinRequest request,
            @Header("simpSessionId") String sessionId,
            Principal principal
    ) {
        AuthUser me = AuthUser.from(principal);
        CallDtos.CallState state = callService.join(channelId, me.id(), request.clientId(), sessionId);
        realtime.toUserCalls(me.username(), "CALL_JOINED", state);
    }

    @MessageMapping("/calls/leave")
    public void leave(Principal principal) {
        callService.leave(AuthUser.from(principal).id());
    }

    @MessageMapping("/calls/state")
    public void state(@Payload CallDtos.StateRequest request, Principal principal) {
        callService.updateState(AuthUser.from(principal).id(), request);
    }

    @MessageMapping("/calls/signal")
    public void signal(@Payload CallDtos.SignalRequest request, Principal principal) {
        callService.relay(AuthUser.from(principal).id(), request);
    }

    @MessageMapping("/calls/{channelId}/decline")
    public void decline(@DestinationVariable Long channelId, Principal principal) {
        callService.decline(channelId, AuthUser.from(principal).id());
    }

    @MessageExceptionHandler(ApiException.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public ErrorResponse handleError(ApiException e) {
        return new ErrorResponse(e.getMessage());
    }
}
