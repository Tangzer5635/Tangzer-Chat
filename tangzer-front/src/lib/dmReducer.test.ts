import { describe, expect, it } from "vitest";

import type { DmConversation, Message, User } from "../types/api";
import { dmReducer, initialDmState } from "./dmReducer";

const me: User = { id: 1, username: "moi", displayName: "Moi" };
const bob: User = { id: 2, username: "bob", displayName: "Bob" };
const zoe: User = { id: 3, username: "zoe", displayName: "Zoé" };

const conversation = (channelId: number, otherUser: User, lastMessageAt: string | null): DmConversation => ({
    channelId, otherUser, lastMessage: null, lastMessageAt, unreadCount: 0, otherLastReadMessageId: null,
});

const message = (id: number, author: User, content: string, createdAt: string): Message => ({
    id, channelId: 0, author, content, createdAt, editedAt: null, replyTo: null, reactions: [],
});

describe("dmReducer", () => {
    it("trie les conversations de la plus récente à la plus ancienne", () => {
        const state = dmReducer(initialDmState, {
            type: "loaded",
            conversations: [
                conversation(10, bob, "2026-01-01T10:00:00Z"),
                conversation(11, zoe, null),
                conversation(12, zoe, "2026-01-02T10:00:00Z"),
            ],
        });

        expect(state.conversations.map((c) => c.channelId)).toEqual([12, 10, 11]);
    });

    it("remonte la conversation qui reçoit un message et met à jour l'aperçu", () => {
        let state = dmReducer(initialDmState, {
            type: "loaded",
            conversations: [conversation(10, bob, "2026-01-02T10:00:00Z"), conversation(11, zoe, "2026-01-01T10:00:00Z")],
        });
        state = dmReducer(state, {
            type: "activity",
            myUserId: me.id,
            activity: { channelId: 11, participants: [me, zoe], message: message(5, zoe, "Coucou !", "2026-01-03T10:00:00Z") },
        });

        expect(state.conversations[0]).toMatchObject({ channelId: 11, otherUser: zoe, lastMessage: { content: "Coucou !" } });
    });

    it("crée la conversation quand quelqu'un m'écrit pour la première fois", () => {
        const state = dmReducer({ loaded: true, conversations: [] }, {
            type: "activity",
            myUserId: me.id,
            activity: { channelId: 20, participants: [me, bob], message: message(1, bob, "x".repeat(100), "2026-01-03T10:00:00Z") },
        });

        expect(state.conversations).toHaveLength(1);
        expect(state.conversations[0].otherUser).toEqual(bob);
        expect(state.conversations[0].lastMessage?.content).toHaveLength(81);
    });
});
