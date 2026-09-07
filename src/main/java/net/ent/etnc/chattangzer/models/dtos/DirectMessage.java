package net.ent.etnc.chattangzer.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
public class DirectMessage {

    @Getter @Setter
    private String recipient;

    @Getter @Setter
    private String content;

    @Getter @Setter
    private String messageId;
}
