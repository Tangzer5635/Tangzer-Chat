import { rms, SPEAKING_THRESHOLD } from "./callsState";

/**
 * Petits outils audio, sans aucun fichier son : tout est synthétisé par le navigateur.
 */

let sharedContext: AudioContext | null = null;

function audioContext(): AudioContext {
    sharedContext ??= new AudioContext();
    if (sharedContext.state === "suspended") {
        void sharedContext.resume();
    }
    return sharedContext;
}

/** Joue une suite de notes (fréquence en Hz, durée en secondes). */
function playNotes(notes: [number, number][], volume = 0.08) {
    const ctx = audioContext();
    let start = ctx.currentTime;
    for (const [frequency, duration] of notes) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
        start += duration;
    }
}

export const playJoinSound = () => playNotes([[523, 0.09], [784, 0.14]]);
/** Petit « ding » de nouveau message ou de mention. */
export const playMessageSound = () => playNotes([[988, 0.07], [1319, 0.12]], 0.05);
export const playLeaveSound = () => playNotes([[784, 0.09], [523, 0.14]]);

/** Sonnerie d'appel entrant, répétée jusqu'à l'appel de la fonction renvoyée. */
export function startRingtone(): () => void {
    const ring = () => playNotes([[880, 0.15], [660, 0.15], [880, 0.15], [660, 0.3]], 0.06);
    ring();
    const timer = setInterval(ring, 2000);
    return () => clearInterval(timer);
}

/**
 * Surveille le volume de plusieurs flux audio et signale qui parle.
 */
export class SpeakingDetector {
    private readonly analysers = new Map<number, { source: MediaStreamAudioSourceNode; analyser: AnalyserNode }>();
    private readonly speaking = new Set<number>();
    private readonly timer: ReturnType<typeof setInterval>;
    private readonly onChange: (speaking: Set<number>) => void;

    constructor(onChange: (speaking: Set<number>) => void) {
        this.onChange = onChange;
        this.timer = setInterval(() => this.measure(), 150);
    }

    watch(userId: number, stream: MediaStream) {
        this.unwatch(userId);
        if (stream.getAudioTracks().length === 0) {
            return;
        }
        const ctx = audioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        this.analysers.set(userId, { source, analyser });
    }

    unwatch(userId: number) {
        const entry = this.analysers.get(userId);
        if (entry) {
            entry.source.disconnect();
            this.analysers.delete(userId);
        }
        if (this.speaking.delete(userId)) {
            this.onChange(new Set(this.speaking));
        }
    }

    stop() {
        clearInterval(this.timer);
        [...this.analysers.keys()].forEach((userId) => this.unwatch(userId));
    }

    private measure() {
        let changed = false;
        const samples = new Uint8Array(512);
        this.analysers.forEach(({ analyser }, userId) => {
            analyser.getByteTimeDomainData(samples);
            const talking = rms(samples) > SPEAKING_THRESHOLD;
            if (talking !== this.speaking.has(userId)) {
                changed = true;
                if (talking) {
                    this.speaking.add(userId);
                } else {
                    this.speaking.delete(userId);
                }
            }
        });
        if (changed) {
            this.onChange(new Set(this.speaking));
        }
    }
}
