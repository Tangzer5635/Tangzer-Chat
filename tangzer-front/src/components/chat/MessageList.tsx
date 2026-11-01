import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { buildRows } from "../../lib/messageRows";
import type { Message } from "../../types/api";

interface MessageListProps {
    messages: Message[];
    hasMore: boolean;
    loadingOlder: boolean;
    onLoadOlder: () => void;
    /** En-tête affiché tout en haut quand tout l'historique est chargé. */
    welcome: ReactNode;
    renderMessage: (message: Message, showHeader: boolean) => ReactNode;
}

/**
 * Fil de messages défilant :
 * - reste collé en bas quand de nouveaux messages arrivent (si on y était) ;
 * - charge l'historique plus ancien en remontant, sans faire sauter l'affichage.
 */
export default function MessageList({ messages, hasMore, loadingOlder, onLoadOlder, welcome, renderMessage }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const stickToBottom = useRef(true);
    const previous = useRef({ firstId: null as number | null, count: 0, scrollHeight: 0 });
    const [atBottom, setAtBottom] = useState(true);

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const firstId = messages[0]?.id ?? null;
        const olderLoaded = previous.current.firstId !== null && firstId !== null && firstId < previous.current.firstId;

        if (olderLoaded) {
            // Des messages ont été ajoutés au-dessus : on garde le même message sous les yeux.
            el.scrollTop += el.scrollHeight - previous.current.scrollHeight;
        } else if (stickToBottom.current) {
            el.scrollTop = el.scrollHeight;
        }

        previous.current = { firstId, count: messages.length, scrollHeight: el.scrollHeight };

        // L'écran n'est pas encore rempli : on charge directement la page précédente.
        if (hasMore && !loadingOlder && el.scrollHeight <= el.clientHeight + 300) {
            onLoadOlder();
        }
    }, [messages, hasMore, loadingOlder, onLoadOlder]);

    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setAtBottom(stickToBottom.current);
        if (el.scrollTop < 300 && hasMore && !loadingOlder) {
            onLoadOlder();
        }
    };

    const jumpToBottom = () => {
        const el = scrollRef.current;
        if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
    };

    return (
        <div className="messages-wrapper">
            <div
                className="messages"
                ref={scrollRef}
                onScroll={onScroll}
                // Une image qui finit de charger agrandit le fil : on reste collé en bas.
                onLoadCapture={() => {
                    if (stickToBottom.current && scrollRef.current) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                }}
            >
                {hasMore ? <div className="messages-loading">{loadingOlder ? "Chargement…" : ""}</div> : welcome}

                {buildRows(messages).map((row) =>
                    row.kind === "day"
                        ? <div key={row.key} className="day-separator"><span>{row.label}</span></div>
                        : <div key={row.key}>{renderMessage(row.message, row.showHeader)}</div>
                )}
            </div>

            {!atBottom && (
                <button className="jump-to-bottom" onClick={jumpToBottom}>
                    Tu consultes d'anciens messages — Revenir en bas ↓
                </button>
            )}
        </div>
    );
}
