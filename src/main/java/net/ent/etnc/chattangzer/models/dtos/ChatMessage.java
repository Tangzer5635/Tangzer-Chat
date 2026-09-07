package net.ent.etnc.chattangzer.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {

    @Getter @Setter
    private MessageType type;

    @Getter @Setter
    private String content;

    @Getter @Setter
    private String sender;

    @Getter @Setter
    private String roomId;

    @Getter @Setter
    private Instant timestamp;

    @Getter @Setter
    private String messageId;

    @Getter @Setter
    private String recipient;

    public ChatMessage(MessageType type, String content, String sender, String roomId) {
        this(type, content, sender, roomId, Instant.now(), null, null);
    }

    public ChatMessage(MessageType type, String content, String sender, String roomId, Instant timestamp) {
        this(type, content, sender, roomId, timestamp, null, null);
    }
}
