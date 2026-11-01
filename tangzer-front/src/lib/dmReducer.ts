import type { DmActivity, DmConversation } from "../types/api";

/**
 * Liste de mes conversations privées, la plus récente en haut.
 */

export interface DmState {
    loaded: boolean;
    conversations: DmConversation[];
}

export type DmAction =
    | { type: "loaded"; conversations: DmConversation[] }
    | { type: "upserted"; conversation: DmConversation }
    | { type: "activity"; activity: DmActivity; myUserId: number };

export const initialDmState: DmState = { loaded: false, conversations: [] };

const PREVIEW_LENGTH = 80;

function sortByRecent(conversations: DmConversation[]): DmConversation[] {
    return [...conversations].sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export function dmReducer(state: DmState, action: DmAction): DmState {
    switch (action.type) {
        case "loaded":
            return { loaded: true, conversations: sortByRecent(action.conversations) };

        case "upserted": {
            const others = state.conversations.filter((c) => c.channelId !== action.conversation.channelId);
            return { ...state, conversations: sortByRecent([...others, action.conversation]) };
        }

        case "activity": {
            const { activity, myUserId } = action;
            const existing = state.conversations.find((c) => c.channelId === activity.channelId);
            const otherUser = existing?.otherUser
                ?? activity.participants.find((p) => p.id !== myUserId)
                ?? activity.participants[0];
            const content = activity.message.content;

            const updated: DmConversation = {
                channelId: activity.channelId,
                otherUser,
                lastMessage: {
                    id: activity.message.id,
                    author: activity.message.author,
                    content: content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH)}…` : content,
                },
                lastMessageAt: activity.message.createdAt,
                unreadCount: existing?.unreadCount ?? 0,
                otherLastReadMessageId: existing?.otherLastReadMessageId ?? null,
            };
            return dmReducer(state, { type: "upserted", conversation: updated });
        }
    }
}
