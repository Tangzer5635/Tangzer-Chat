import type { ChannelMessage } from "../types/api";

/** Deux messages du même auteur à moins de 5 minutes sont affichés ensemble (comme Discord). */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

export interface MessageGroup {
    id: string;
    author: ChannelMessage["author"];
    messages: ChannelMessage[];
}

export function groupMessages(messages: ChannelMessage[]): MessageGroup[] {
    const groups: MessageGroup[] = [];

    for (const message of messages) {
        const last = groups[groups.length - 1];
        const previous = last?.messages[last.messages.length - 1];
        const sameAuthor = last && last.author.id === message.author.id;
        const closeInTime = previous
            && new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < GROUP_WINDOW_MS;

        if (sameAuthor && closeInTime) {
            last.messages.push(message);
        } else {
            groups.push({ id: message.id, author: message.author, messages: [message] });
        }
    }
    return groups;
}

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
