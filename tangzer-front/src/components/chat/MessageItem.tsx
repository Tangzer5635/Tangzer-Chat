import { useState, type KeyboardEvent } from "react";

import { QUICK_REACTIONS } from "../../lib/choices";
import { mentionsUser, toPlainText } from "../../lib/markdown";
import { formatDateTime, formatTime } from "../../lib/messageRows";
import type { Message, User } from "../../types/api";
import Avatar from "../Avatar";
import MessageText from "./MessageText";

interface MessageItemProps {
    message: Message;
    showHeader: boolean;
    me: User;
    canModerate: boolean;
    editing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: (content: string) => void;
    onReply: () => void;
    onDelete: () => void;
    onReact: (emoji: string) => void;
    onRetry: () => void;
    onJumpTo: (messageId: number) => void;
    /** Dernier de mes messages lu par l'autre participant (conversation privée). */
    seen?: boolean;
}

/** Un message : en-tête éventuel, contenu mis en forme, réactions et barre d'actions au survol. */
export default function MessageItem(props: MessageItemProps) {
    const { message, showHeader, me, canModerate, editing } = props;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [draft, setDraft] = useState(message.content);

    const isOwn = message.author.id === me.id;
    const mentioned = !isOwn && mentionsUser(message.content, me.username);
    const confirmed = !message.pending && !message.failed;

    const classes = ["message"];
    if (showHeader) classes.push("with-header");
    if (mentioned) classes.push("mentioned");
    if (message.pending) classes.push("pending");
    if (editing) classes.push("editing");

    const onEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape") {
            props.onCancelEdit();
        }
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            props.onSaveEdit(draft);
        }
    };

    return (
        <div className={classes.join(" ")} id={`message-${message.id}`}>
            {message.replyTo && (
                <button className="reply-preview" onClick={() => props.onJumpTo(message.replyTo!.id)}>
                    <span className="reply-spine" />
                    <Avatar user={message.replyTo.author} size={16} />
                    <strong>{message.replyTo.author.displayName}</strong>
                    <span className="reply-preview-text">{toPlainText(message.replyTo.content)}</span>
                </button>
            )}

            <div className="message-row">
                <div className="message-gutter">
                    {showHeader
                        ? <Avatar user={message.author} />
                        : <time className="message-hover-time" title={formatDateTime(message.createdAt)}>{formatTime(message.createdAt)}</time>}
                </div>

                <div className="message-body">
                    {showHeader && (
                        <div className="message-meta">
                            <strong>{message.author.displayName}</strong>
                            <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>
                                {formatTime(message.createdAt)}
                            </time>
                        </div>
                    )}

                    {editing ? (
                        <div className="message-edit">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={onEditKeyDown}
                                maxLength={2000}
                                autoFocus
                                rows={1}
                            />
                            <p className="form-hint">
                                échap pour <button className="link-button" onClick={props.onCancelEdit}>annuler</button>
                                {" • "}entrée pour <button className="link-button" onClick={() => props.onSaveEdit(draft)}>enregistrer</button>
                            </p>
                        </div>
                    ) : (
                        <div className="message-content">
                            <MessageText content={message.content} myUsername={me.username} />
                            {message.editedAt && <span className="message-edited" title={formatDateTime(message.editedAt)}> (modifié)</span>}
                        </div>
                    )}

                    {props.seen && <p className="message-seen">✓✓ Vu</p>}

                    {message.failed && (
                        <p className="message-failed">
                            Échec de l'envoi. <button className="link-button" onClick={props.onRetry}>Réessayer</button>
                        </p>
                    )}

                    {message.reactions.length > 0 && (
                        <div className="reactions">
                            {message.reactions.map((reaction) => (
                                <button
                                    key={reaction.emoji}
                                    className={reaction.userIds.includes(me.id) ? "reaction mine" : "reaction"}
                                    onClick={() => props.onReact(reaction.emoji)}
                                >
                                    <span>{reaction.emoji}</span> {reaction.userIds.length}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {confirmed && !editing && (
                <div className="message-toolbar">
                    <button title="Ajouter une réaction" onClick={() => setPickerOpen((v) => !v)}>😀</button>
                    <button title="Répondre" onClick={props.onReply}>↩️</button>
                    {isOwn && (
                        <button
                            title="Modifier"
                            onClick={() => {
                                setDraft(message.content);
                                props.onStartEdit();
                            }}
                        >
                            ✏️
                        </button>
                    )}
                    {(isOwn || canModerate) && <button title="Supprimer" onClick={props.onDelete}>🗑️</button>}
                </div>
            )}

            {pickerOpen && (
                <div className="reaction-picker" onMouseLeave={() => setPickerOpen(false)}>
                    {QUICK_REACTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => {
                                props.onReact(emoji);
                                setPickerOpen(false);
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
