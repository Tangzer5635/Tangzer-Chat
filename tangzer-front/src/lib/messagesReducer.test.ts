import { describe, expect, it } from "vitest";

import type { Message } from "../types/api";
import { initialMessagesState, messagesReducer, type MessagesState } from "./messagesReducer";

const alice = { id: 1, username: "alice", displayName: "Alice" };

const message = (id: number, overrides: Partial<Message> = {}): Message => ({
    id,
    channelId: 1,
    author: alice,
    content: `message ${id}`,
    createdAt: "2026-01-01T12:00:00Z",
    editedAt: null,
    replyTo: null,
    reactions: [],
    attachments: [],
    ...overrides,
});

const withHistory = (...messages: Message[]): MessagesState =>
    messagesReducer(initialMessagesState, { type: "historyLoaded", messages, hasMore: true });

describe("messagesReducer", () => {
    it("ajoute les messages plus anciens au début, sans doublon", () => {
        let state = withHistory(message(3), message(4));
        state = messagesReducer(state, { type: "olderLoading" });
        expect(state.loadingOlder).toBe(true);

        state = messagesReducer(state, { type: "olderLoaded", messages: [message(1), message(2), message(3)], hasMore: false });

        expect(state.messages.map((m) => m.id)).toEqual([1, 2, 3, 4]);
        expect(state.hasMore).toBe(false);
        expect(state.loadingOlder).toBe(false);
    });

    it("remplace le message en cours d'envoi par le vrai", () => {
        let state = withHistory(message(1));
        state = messagesReducer(state, {
            type: "pendingAdded",
            message: message(-1, { nonce: "abc", pending: true, content: "salut" }),
        });
        state = messagesReducer(state, { type: "received", message: message(2, { nonce: "abc", content: "salut" }) });

        expect(state.messages.map((m) => m.id)).toEqual([1, 2]);
        expect(state.messages[1].pending).toBe(false);
    });

    it("ignore un message déjà reçu (réponse REST + événement)", () => {
        let state = withHistory(message(1));
        state = messagesReducer(state, { type: "received", message: message(2) });
        state = messagesReducer(state, { type: "received", message: message(2) });

        expect(state.messages).toHaveLength(2);
    });

    it("signale un envoi en échec", () => {
        let state = messagesReducer(withHistory(), {
            type: "pendingAdded", message: message(-1, { nonce: "n1", pending: true }),
        });
        state = messagesReducer(state, { type: "failed", nonce: "n1" });

        expect(state.messages[0]).toMatchObject({ pending: false, failed: true });
    });

    it("met à jour, supprime et retire les citations du message supprimé", () => {
        let state = withHistory(
            message(1),
            message(2, { replyTo: { id: 1, author: alice, content: "message 1" } }),
        );
        state = messagesReducer(state, { type: "updated", message: message(2, { content: "modifié", editedAt: "x" }) });
        state = messagesReducer(state, { type: "deleted", messageId: 1 });

        expect(state.messages).toHaveLength(1);
        expect(state.messages[0]).toMatchObject({ content: "modifié", replyTo: null });
    });

    it("met à jour les réactions", () => {
        const state = messagesReducer(withHistory(message(1)), {
            type: "reactionsUpdated", messageId: 1, reactions: [{ emoji: "🔥", userIds: [1, 2] }],
        });

        expect(state.messages[0].reactions).toEqual([{ emoji: "🔥", userIds: [1, 2] }]);
    });
});
