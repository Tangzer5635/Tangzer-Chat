package net.ent.etnc.chattangzer.services;

import net.ent.etnc.chattangzer.models.dtos.RealtimeEvent;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Envoie les événements temps réel aux clients STOMP.
 *
 * Destinations :
 *   /topic/servers/{id}   tout ce qui concerne un serveur (salons, membres…)
 *   /topic/channels/{id}  tout ce qui se passe dans un salon (messages…)
 *   /user/queue/events    événements personnels d'un utilisateur
 *   /user/queue/calls     signalisation des appels (WebRTC)
 *
 * Si on est dans une transaction, l'envoi attend le commit : un client
 * ne reçoit jamais un événement qui serait ensuite annulé.
 */
@Service
public class RealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void toServer(Long serverId, String type, Object payload) {
        afterCommit(() -> messagingTemplate.convertAndSend(
                "/topic/servers/" + serverId, new RealtimeEvent(type, payload)));
    }

    public void toChannel(Long channelId, String type, Object payload) {
        afterCommit(() -> messagingTemplate.convertAndSend(
                "/topic/channels/" + channelId, new RealtimeEvent(type, payload)));
    }

    public void toUser(String username, String type, Object payload) {
        afterCommit(() -> messagingTemplate.convertAndSendToUser(
                username, "/queue/events", new RealtimeEvent(type, payload)));
    }

    public void toUserCalls(String username, String type, Object payload) {
        afterCommit(() -> messagingTemplate.convertAndSendToUser(
                username, "/queue/calls", new RealtimeEvent(type, payload)));
    }

    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
