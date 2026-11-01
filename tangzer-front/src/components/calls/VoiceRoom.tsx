import { useCalls } from "../../context/calls";
import type { Channel } from "../../types/api";
import CallControls from "./CallControls";
import CallTiles from "./CallTiles";

/** Page d'un salon vocal : qui est là, rejoindre, et les contrôles. */
export default function VoiceRoom({ channel }: { channel: Channel }) {
    const { calls, current, join, connecting, supported } = useCalls();
    const participants = calls[channel.id]?.participants ?? [];
    const inThisCall = current?.channelId === channel.id;

    return (
        <section className="chat voice-room">
            <header className="chat-header">
                <span className="chat-header-hash">🔊</span>
                <h1>{channel.name}</h1>
                {channel.topic && <span className="chat-header-topic">{channel.topic}</span>}
            </header>

            <div className="voice-stage">
                {participants.length > 0 ? (
                    <CallTiles participants={participants} />
                ) : (
                    <div className="voice-empty">
                        <div className="voice-empty-icon">🔊</div>
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
                    <p className="form-error">Le micro n'est disponible qu'en HTTPS : ouvre l'application avec https://…</p>
                )}
            </div>
        </section>
    );
}
