import { Volume2 } from "lucide-react";

import { useCalls } from "../../context/calls";
import type { Channel } from "../../types/api";
import CallControls from "./CallControls";
import CallTiles from "./CallTiles";
import Alert from "../ui/Alert";

/** Page d'un salon vocal : qui est là, rejoindre, et les contrôles. */
export default function VoiceRoom({ channel }: { channel: Channel }) {
    const { calls, current, join, connecting, supported } = useCalls();
    const participants = calls[channel.id]?.participants ?? [];
    const inThisCall = current?.channelId === channel.id;

    return (
        <section className="chat voice-room">
            <header className="chat-header">
                <Volume2 className="chat-header-hash" size={22} />
                <h1>{channel.name}</h1>
                {channel.topic && <span className="chat-header-topic">{channel.topic}</span>}
            </header>

            <div className="voice-stage">
                {participants.length > 0 ? (
                    <CallTiles participants={participants} />
                ) : (
                    <div className="voice-empty">
                        <Volume2 className="voice-empty-icon" size={48} />
                        <h2>Personne pour l'instant</h2>
                        <p>Rejoins le salon : les autres membres te verront arriver.</p>
                    </div>
                )}

                <div className="voice-actions">
                    {inThisCall ? (
                        <CallControls large />
                    ) : (
                        <button className="button-success big-call" onClick={() => void join(channel.id)} disabled={connecting}>
                            {connecting ? "Connexion…" : participants.length > 0 ? "Rejoindre la conversation" : "Rejoindre le salon vocal"}
                        </button>
                    )}
                </div>
                {!supported && (
                    <Alert tone="warning">Le micro n'est disponible qu'en HTTPS : ouvre l'application avec https://…</Alert>
                )}
            </div>
        </section>
    );
}
