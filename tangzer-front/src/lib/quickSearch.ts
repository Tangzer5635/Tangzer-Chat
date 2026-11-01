import type { Channel, Server } from "../types/api";

/** Ignore la casse et les accents : « general » trouve « général ». */
export function normalize(text: string): string {
    return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/**
 * Mes salons (textuels et vocaux) dont le nom, ou le nom du serveur, contient
 * la recherche. Les salons dont le nom correspond passent en premier.
 */
export function searchMyChannels(servers: Server[], query: string, limit = 6): { server: Server; channel: Channel }[] {
    const q = normalize(query);
    if (!q) {
        return [];
    }
    const byChannel: { server: Server; channel: Channel }[] = [];
    const byServer: { server: Server; channel: Channel }[] = [];
    for (const server of servers) {
        const serverMatches = normalize(server.name).includes(q);
        for (const channel of server.channels) {
            if (normalize(channel.name).includes(q)) {
                byChannel.push({ server, channel });
            } else if (serverMatches) {
                byServer.push({ server, channel });
            }
        }
    }
    return [...byChannel, ...byServer].slice(0, limit);
}
