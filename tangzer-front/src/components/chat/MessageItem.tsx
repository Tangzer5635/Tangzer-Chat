import { CheckCheck, FaceSlightlySmilingPlus, Pencil, Reply, Trash } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

import { useLiveUser } from "../../context/users";
import { QUICK_REACTIONS } from "../../lib/choices";
import { mentionsUser, toPlainText } from "../../lib/markdown";
import { formatDateTime, formatTime } from "../../lib/messageRows";
import type { Message, User } from "../../types/api";
import Avatar from "../Avatar";
import AttachmentGrid from "./AttachmentGrid";
import { useDismiss } from "../ui/useDismiss";
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
    onOpenProfile?: (user: User) => void;
}

/** Un message : en-tête éventuel, contenu mis en forme, réactions et barre d'actions au survol. */
export default function MessageItem(props: MessageItemProps) {
    const { message, showHeader, me, canModerate, editing } = props;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [draft, setDraft] = useState(message.content);
    const pickerRef = useRef<HTMLDivElement>(null);
    const pickerButtonRef = useRef<HTMLButtonElement>(null);
    useDismiss(pickerOpen, () => setPickerOpen(false), pickerRef, pickerButtonRef);

    const author = useLiveUser(message.author);
    const isOwn = message.author.id === me.id;
    const mentioned = !isOwn && mentionsUser(message.content, me.username);
    const confirmed = !message.pending && !message.failed;

    const classes = ["message"];
    if (showHeader) classes.push("with-header");
    if (mentioned) classes.push("mentioned");
    if (message.pending) classes.push("pending");
    if (editing) classes.push("editing");
    if (pickerOpen) classes.push("picking");

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
        // Chaque message reçoit le focus avec les flèches (voir MessageList) ; ses actions s'affichent alors.
        <article className={classes.join(" ")} id={`message-${message.id}`} tabIndex={-1}>
            {message.replyTo && (
                <button className="reply-preview" onClick={() => props.onJumpTo(message.replyTo!.id)}>
                    <span className="sr-only">En réponse à</span>
                    <span className="reply-spine" aria-hidden="true" />
                    <Avatar user={message.replyTo.author} size={16} />
                    <strong>{message.replyTo.author.displayName}</strong>
                    <span className="reply-preview-text">{toPlainText(message.replyTo.content) || "Photo"}</span>
                </button>
            )}

            <div className="message-row">
                <div className="message-gutter">
                    {showHeader ? (
                        <>
                            {/* Doublon du nom de l'auteur (cliquable juste à côté) : ignoré au clavier et à l'écoute. */}
                            <button className="avatar-button" onClick={() => props.onOpenProfile?.(author)} tabIndex={-1} aria-hidden="true">
                                <Avatar user={author} />
                            </button>
                            <time className="message-compact-time">{formatTime(message.createdAt)}</time>
                        </>
                    ) : (
                        <>
                            <span className="sr-only">{author.displayName}, </span>
                            <time className="message-hover-time" dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>{formatTime(message.createdAt)}</time>
                        </>
                    )}
                </div>

                <div className="message-body">
                    {showHeader && (
                        <div className="message-meta">
                            <button className="author-name" onClick={() => props.onOpenProfile?.(author)}>
                                {author.displayName}
                            </button>
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
                                aria-label="Modifier le message"
                                maxLength={2000}
                                autoFocus
                                rows={1}
                            />
                            <p className="form-hint">
                                échap pour <button className="link-button" onClick={props.onCancelEdit}>annuler</button>
                                {" • "}entrée pour <button className="link-button" onClick={() => props.onSaveEdit(draft)}>enregistrer</button>
                            </p>
                        </div>
                    ) : (message.content || message.editedAt) && (
                        <div className="message-content">
                            <MessageText content={message.content} myUsername={me.username} />
                            {message.editedAt && <span className="message-edited" title={formatDateTime(message.editedAt)}> (modifié)</span>}
                        </div>
                    )}

                    <AttachmentGrid attachments={message.attachments} />

                    {props.seen && <p className="message-seen"><CheckCheck size={14} /> Vu</p>}

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
                                    aria-pressed={reaction.userIds.includes(me.id)}
                                    aria-label={`Réaction ${reaction.emoji} : ${reaction.userIds.length}`}
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
                    <button ref={pickerButtonRef} title="Ajouter une réaction" aria-label="Ajouter une réaction" aria-expanded={pickerOpen} onClick={() => setPickerOpen((v) => !v)}>
                        <FaceSlightlySmilingPlus size={18} />
                    </button>
                    <button title="Répondre" aria-label="Répondre" onClick={props.onReply}>
                        <Reply size={18} />
                    </button>
                    {isOwn && (
                        <button
                            title="Modifier"
                            aria-label="Modifier le message"
                            onClick={() => {
                                setDraft(message.content);
                                props.onStartEdit();
                            }}
                        >
                            <Pencil size={18} />
                        </button>
                    )}
                    {(isOwn || canModerate) && (
                        <button title="Supprimer" aria-label="Supprimer le message" className="danger" onClick={props.onDelete}>
                            <Trash size={18} />
                        </button>
                    )}
                </div>
            )}

            {pickerOpen && (
                <div className="reaction-picker" ref={pickerRef} role="group" aria-label="Réactions rapides">
                    {QUICK_REACTIONS.map((emoji, index) => (
                        <button
                            key={emoji}
                            aria-label={`Réagir avec ${emoji}`}
                            autoFocus={index === 0}
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
        </article>
    );
}
