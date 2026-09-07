import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import type { ChatMessage } from "../types/ChatMessage";


let messageHandler:
    ((msg: ChatMessage) => void) | null = null;

let privateMessageHandler:
    ((msg: ChatMessage) => void) | null = null;

let roomMessageHandler:
    ((msg: ChatMessage) => void) | null = null;

let notificationHandler:
    ((text: string, link?: string) => void) | null = null;

let currentRoomSubscription:
    { unsubscribe: () => void } | null = null;

function normalizeMessage(msg: ChatMessage): ChatMessage {
    return {
        ...msg,
        timestamp: msg.timestamp ?? new Date().toISOString(),
    };
}

/*
 * ============================================================
 * Client STOMP
 * ============================================================
 */

const client = new Client({
    connectHeaders: {},
    webSocketFactory: () => {
        const token = localStorage.getItem("jwt");
        return new SockJS(`http://localhost:8080/ws?token=${token}`);
    },

    reconnectDelay: 5000,

    onConnect: () => {

        console.log("STOMP connecté");

        client.subscribe(
            "/topic/public",
            (message: IMessage) => {
                const msg = normalizeMessage(
                    JSON.parse(message.body) as ChatMessage
                );
                if (messageHandler) messageHandler(msg);
            }
        );

        client.subscribe(
            "/user/queue/private",
            (message: IMessage) => {
                const msg = normalizeMessage(
                    JSON.parse(message.body) as ChatMessage
                );

                if (privateMessageHandler) {
                    privateMessageHandler(msg);
                }

                /* Notification + badge */
                if (notificationHandler) {
                    notificationHandler(
                        `💬 Message de ${msg.sender}`);
                }

            }
        );
    },

    onDisconnect: () =>
        console.log("STOMP déconnecté"),

    onStompError: (frame) =>
        console.error(
            "Erreur STOMP :",
            frame.headers["message"]
        ),

    onWebSocketError: (error) =>
        console.error("Erreur WebSocket :", error),
});

/*
 * ============================================================
 * Connexion
 * ============================================================
 */

export function connectWebSocket(
    onMessage: (msg: ChatMessage) => void,
    onPrivateMessage: (msg: ChatMessage) => void,
    onNotification: (text: string, link?: string) => void
) {

    messageHandler = onMessage;
    privateMessageHandler = onPrivateMessage;
    notificationHandler = onNotification;

    const token = localStorage.getItem("jwt");

    if (!token) {
        console.error("Aucun JWT trouvé");
        return;
    }

    // IMPORTANT : Spring lit Authorization dans STOMP CONNECT.
    client.connectHeaders = {
        Authorization: `Bearer ${token}`,
    };

    if (client.active) {
        void client.deactivate().then(() => {
            client.activate();
        });
        return;
    }

    client.activate();
}

export function disconnectWebSocket() {

    if (currentRoomSubscription) {
        currentRoomSubscription.unsubscribe();
        currentRoomSubscription = null;
    }

    if (client.active) {
        void client.deactivate();
    }

    messageHandler = null;
    privateMessageHandler = null;
    roomMessageHandler = null;
    notificationHandler = null;
}

/*
 * ============================================================
 * Chat public
 * ============================================================
 */

export function sendMessage(content: string) {

    if (!client.connected) {
        console.error("WebSocket non connecté");
        return;
    }

    console.log("Envoi chat public → /app/chat.send", content);

    client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ content }),
    });
}

/*
 * ============================================================
 * DM
 * ============================================================
 */

export function sendPrivateMessage(
    recipient: string,
    content: string
) {

    if (!client.connected) {
        console.error("WebSocket non connecté");
        return;
    }

    client.publish({
        destination: "/app/chat.direct",
        body: JSON.stringify({ recipient, content }),
    });
}

/*
 * ============================================================
 * Salons
 * ============================================================
 */

export function joinRoom(
    roomId: string,
    onMessage: (msg: ChatMessage) => void
) {

    if (!client.connected) {
        console.error("WebSocket non connecté");
        return;
    }

    if (currentRoomSubscription) {
        currentRoomSubscription.unsubscribe();
        currentRoomSubscription = null;
    }

    roomMessageHandler = onMessage;

    currentRoomSubscription = client.subscribe(
        `/topic/room/${roomId}`,
        (message: IMessage) => {
            const msg = normalizeMessage(
                JSON.parse(message.body) as ChatMessage
            );
            if (roomMessageHandler) {
                roomMessageHandler(msg);
            }
        }
    );

    client.publish({
        destination: `/app/room/${roomId}/join`,
        body: JSON.stringify({}),
    });
}

export function sendRoomMessage(
    roomId: string,
    content: string
) {

    if (!client.connected) {
        console.error("WebSocket non connecté");
        return;
    }

    client.publish({
        destination: `/app/room/${roomId}/send`,
        body: JSON.stringify({ content }),
    });
}