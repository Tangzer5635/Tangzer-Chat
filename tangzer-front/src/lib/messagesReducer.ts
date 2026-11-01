import type { Message, Reaction } from "../types/api";

/**
 * Messages d'un salon affiché : historique chargé par pages,
 * messages « en cours d'envoi », et mises à jour temps réel.
 */

export interface MessagesState {
    messages: Message[];
    loaded: boolean;
    /** Il reste des messages plus anciens à charger. */
    hasMore: boolean;
    loadingOlder: boolean;
}

export type MessagesAction =
    | { type: "historyLoaded"; messages: Message[]; hasMore: boolean }
    | { type: "olderLoading" }
    | { type: "olderLoaded"; messages: Message[]; hasMore: boolean }
    | { type: "pendingAdded"; message: Message }
    | { type: "received"; message: Message }
    | { type: "failed"; nonce: string }
    | { type: "updated"; message: Message }
    | { type: "deleted"; messageId: number }
    | { type: "reactionsUpdated"; messageId: number; reactions: Reaction[] };

export const initialMessagesState: MessagesState = {
    messages: [],
    loaded: false,
    hasMore: false,
    loadingOlder: false,
};

export function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
    switch (action.type) {
        case "historyLoaded": {
            // Les messages reçus en direct (ou envoyés) pendant le chargement ne doivent pas disparaître.
            const loadedIds = new Set(action.messages.map((m) => m.id));
            const arrivedMeanwhile = state.messages.filter((m) => !loadedIds.has(m.id));
            return {
                messages: [...action.messages, ...arrivedMeanwhile],
                loaded: true,
                hasMore: action.hasMore,
                loadingOlder: false,
            };
        }

        case "olderLoading":
            return { ...state, loadingOlder: true };

        case "olderLoaded": {
            const known = new Set(state.messages.map((m) => m.id));
            const older = action.messages.filter((m) => !known.has(m.id));
            return { ...state, messages: [...older, ...state.messages], hasMore: action.hasMore, loadingOlder: false };
        }

        case "pendingAdded":
            return { ...state, messages: [...state.messages, action.message] };

        case "received": {
            const message = { ...action.message, pending: false, failed: false };
            // Déjà connu (réponse REST et événement temps réel arrivent tous les deux).
            if (state.messages.some((m) => m.id === message.id && !m.pending)) {
                return state;
            }
            // Remplace mon message « en cours d'envoi » au même endroit.
            if (message.nonce && state.messages.some((m) => m.pending && m.nonce === message.nonce)) {
                return {
                    ...state,
                    messages: state.messages.map((m) => (m.pending && m.nonce === message.nonce ? message : m)),
                };
            }
            return { ...state, messages: [...state.messages, message] };
        }

        case "failed":
            return {
                ...state,
                messages: state.messages.map((m) => (m.nonce === action.nonce ? { ...m, pending: false, failed: true } : m)),
            };

        case "updated":
            return {
                ...state,
                messages: state.messages.map((m) => (m.id === action.message.id ? { ...action.message } : m)),
            };

        case "deleted":
            return {
                ...state,
                messages: state.messages
                    .filter((m) => m.id !== action.messageId)
                    // Les réponses à ce message perdent leur citation.
                    .map((m) => (m.replyTo?.id === action.messageId ? { ...m, replyTo: null } : m)),
            };

        case "reactionsUpdated":
            return {
                ...state,
                messages: state.messages.map((m) =>
                    m.id === action.messageId ? { ...m, reactions: action.reactions } : m),
            };
    }
}
