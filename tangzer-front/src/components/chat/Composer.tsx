import { useRef, useState, type KeyboardEvent } from "react";

import type { Message } from "../../types/api";

const TYPING_THROTTLE_MS = 3000;
const MAX_LENGTH = 2000;

interface ComposerProps {
    placeholder: string;
    replyTo: Message | null;
    onCancelReply: () => void;
    onSend: (content: string) => void;
    /** Appelé pendant la frappe (au plus toutes les 3 secondes). */
    onTyping: () => void;
    /** Flèche du haut dans un champ vide : modifier son dernier message. */
    onEditLast: () => void;
}

/** Zone de saisie : Entrée envoie, Maj+Entrée va à la ligne. */
export default function Composer({ placeholder, replyTo, onCancelReply, onSend, onTyping, onEditLast }: ComposerProps) {
    const [draft, setDraft] = useState("");
    const lastTyping = useRef(0);

    const onChange = (value: string) => {
        setDraft(value);
        const now = Date.now();
        if (value.trim() && now - lastTyping.current > TYPING_THROTTLE_MS) {
            lastTyping.current = now;
            onTyping();
        }
    };

    const send = () => {
        const content = draft.trim();
        if (!content) {
            return;
        }
        onSend(content);
        setDraft("");
        lastTyping.current = 0;
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        } else if (e.key === "Escape" && replyTo) {
            onCancelReply();
        } else if (e.key === "ArrowUp" && draft === "") {
            e.preventDefault();
            onEditLast();
        }
    };

    return (
        <div className="composer">
            {replyTo && (
                <div className="composer-reply">
                    <span>Réponse à <strong>{replyTo.author.displayName}</strong></span>
                    <button className="icon-button small" onClick={onCancelReply} aria-label="Annuler la réponse">✕</button>
                </div>
            )}
            <div className={replyTo ? "composer-box with-reply" : "composer-box"}>
                <textarea
                    value={draft}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    maxLength={MAX_LENGTH}
                    autoFocus
                />
                {draft.length > MAX_LENGTH - 200 && (
                    <span className="composer-counter">{MAX_LENGTH - draft.length}</span>
                )}
            </div>
        </div>
    );
}
