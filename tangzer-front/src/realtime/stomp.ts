import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";

import { notifyUnauthorized } from "../api/http";

/**
 * Client STOMP unique de l'application.
 *
 * Les composants s'abonnent avec subscribe(destination, handler) :
 * - plusieurs composants peuvent écouter la même destination
 *   (un seul abonnement STOMP est ouvert, partagé) ;
 * - après une coupure, tous les abonnements sont rétablis automatiquement.
 */

type Handler = (body: unknown) => void;

const handlers = new Map<string, Set<Handler>>();
const openSubscriptions = new Map<string, StompSubscription>();
const statusListeners = new Set<() => void>();

let connected = false;

// Le WebSocket est servi sur la même origine que le front (proxy Vite ou nginx).
function webSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/ws`;
}

function setConnected(value: boolean) {
    if (connected !== value) {
        connected = value;
        statusListeners.forEach((listener) => listener());
    }
}

const client = new Client({
    brokerURL: webSocketUrl(),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
        openSubscriptions.clear();
        handlers.forEach((_, destination) => openSubscription(destination));
        setConnected(true);
    },

    onWebSocketClose: () => {
        openSubscriptions.clear();
        setConnected(false);
    },

    onStompError: (frame) => {
        console.error("Erreur STOMP :", frame.headers["message"]);
        // Token refusé à la connexion : la session n'est plus valide.
        if (frame.headers["message"]?.includes("JWT")) {
            notifyUnauthorized();
        }
    },
});

function openSubscription(destination: string) {
    const subscription = client.subscribe(destination, (message: IMessage) => {
        const body: unknown = message.body ? JSON.parse(message.body) : null;
        handlers.get(destination)?.forEach((handler) => handler(body));
    });
    openSubscriptions.set(destination, subscription);
}

/** Écoute une destination ; renvoie la fonction de désabonnement. */
export function subscribe(destination: string, handler: Handler): () => void {
    let destinationHandlers = handlers.get(destination);

    if (!destinationHandlers) {
        destinationHandlers = new Set();
        handlers.set(destination, destinationHandlers);
        if (client.connected) {
            openSubscription(destination);
        }
    }
    destinationHandlers.add(handler);

    return () => {
        destinationHandlers.delete(handler);
        if (destinationHandlers.size > 0 || handlers.get(destination) !== destinationHandlers) {
            return;
        }
        handlers.delete(destination);
        const subscription = openSubscriptions.get(destination);
        openSubscriptions.delete(destination);
        if (subscription && client.connected) {
            subscription.unsubscribe();
        }
    };
}

/** Envoie un message STOMP ; renvoie false si on est déconnecté. */
export function publish(destination: string, body: unknown = {}): boolean {
    if (!client.connected) {
        return false;
    }
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
}

export function connect(token: string) {
    client.connectHeaders = { Authorization: `Bearer ${token}` };
    if (!client.active) {
        client.activate();
    }
}

export function disconnect() {
    void client.deactivate();
    openSubscriptions.clear();
    setConnected(false);
}

export function isConnected(): boolean {
    return connected;
}

export function onStatusChange(listener: () => void): () => void {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
}
