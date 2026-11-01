import { publish } from "./stomp";

/** Messages privés temps réel (version en mémoire, réécrite en phase 4). */

export function sendPrivateMessage(recipient: string, content: string, messageId: string) {
    return publish("/app/chat.direct", { recipient, content, messageId });
}

export function sendTyping(recipient: string, typing: boolean) {
    publish("/app/chat.typing", { recipient, typing });
}

export function sendReadReceipt(messageId: string, sender: string) {
    publish("/app/chat.read", { messageId, sender });
}
