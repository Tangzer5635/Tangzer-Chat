/**
 * Mémorise le dernier serveur et le dernier salon visités (dans ce navigateur),
 * pour y revenir directement à la prochaine ouverture.
 */

const SERVER_KEY = "tangzer.lastServer";
const channelKey = (serverId: number) => `tangzer.lastChannel.${serverId}`;

function read(key: string): number | null {
    try {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
        return null;
    }
}

function write(key: string, value: number) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Stockage indisponible (navigation privée) : tant pis.
    }
}

export const getLastServer = () => read(SERVER_KEY);
export const getLastChannel = (serverId: number) => read(channelKey(serverId));

export function rememberChannel(serverId: number, channelId: number) {
    write(SERVER_KEY, serverId);
    write(channelKey(serverId), channelId);
}
