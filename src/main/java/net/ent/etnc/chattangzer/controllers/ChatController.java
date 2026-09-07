package net.ent.etnc.chattangzer.controllers;

import net.ent.etnc.chattangzer.models.dtos.ChatMessage;
import net.ent.etnc.chattangzer.models.dtos.DirectMessage;
import net.ent.etnc.chattangzer.models.dtos.MessageStatus;
import net.ent.etnc.chattangzer.models.dtos.MessageType;
import net.ent.etnc.chattangzer.models.dtos.ReadReceipt;
import net.ent.etnc.chattangzer.models.dtos.TypingStatus;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(
            @Payload ChatMessage message,
            Principal user
    ) {
        message.setSender(user.getName());
        message.setTimestamp(Instant.now());

        if (message.getMessageId() == null || message.getMessageId().isBlank()) {
            message.setMessageId(UUID.randomUUID().toString());
        }

        return message;
    }

    @MessageMapping("/chat.direct")
    public void directMessage(
            @Payload DirectMessage message,
            Principal from
    ) {
        String messageId = message.getMessageId();

        if (messageId == null || messageId.isBlank()) {
            messageId = UUID.randomUUID().toString();
        }

        ChatMessage privateMessage = new ChatMessage(
                MessageType.CHAT,
                message.getContent(),
                from.getName(),
                null,
                Instant.now(),
                messageId,
                message.getRecipient()
        );

        // Le destinataire reçoit le vrai message.
        messagingTemplate.convertAndSendToUser(
                message.getRecipient(),
                "/queue/private",
                privateMessage
        );

        // Le sender reçoit immédiatement l'état "distribué".
        messagingTemplate.convertAndSendToUser(
                from.getName(),
                "/queue/private-status",
                new MessageStatus(
                        messageId,
                        "DELIVERED",
                        message.getRecipient()
                )
        );
    }

    @MessageMapping("/chat.typing")
    public void typing(
            @Payload TypingStatus typingStatus,
            Principal from
    ) {
        if (typingStatus.recipient() == null || typingStatus.recipient().isBlank()) {
            return;
        }

        messagingTemplate.convertAndSendToUser(
                typingStatus.recipient(),
                "/queue/private-typing",
                new TypingStatus(
                        from.getName(),
                        typingStatus.recipient(),
                        typingStatus.typing()
                )
        );
    }

    @MessageMapping("/chat.read")
    public void read(
            @Payload ReadReceipt receipt,
            Principal reader
    ) {
        if (receipt.messageId() == null || receipt.messageId().isBlank()) {
            return;
        }

        if (receipt.sender() == null || receipt.sender().isBlank()) {
            return;
        }

        // Le lecteur indique à l'expéditeur que son message est lu.
        messagingTemplate.convertAndSendToUser(
                receipt.sender(),
                "/queue/private-status",
                new MessageStatus(
                        receipt.messageId(),
                        "READ",
                        reader.getName()
                )
        );
    }
}
