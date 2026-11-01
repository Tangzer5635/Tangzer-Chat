import { useState, type ReactNode } from "react";

import { parseInviteCode } from "../../lib/invites";
import { parseMarkdown, type MdNode } from "../../lib/markdown";
import InviteEmbed from "./InviteEmbed";

function Spoiler({ children }: { children: ReactNode }) {
    const [revealed, setRevealed] = useState(false);
    return (
        <span
            className={revealed ? "spoiler revealed" : "spoiler"}
            onClick={() => setRevealed(true)}
            title={revealed ? undefined : "Cliquer pour révéler"}
        >
            {children}
        </span>
    );
}

function renderNodes(nodes: MdNode[], myUsername: string): ReactNode[] {
    return nodes.map((node, index) => {
        switch (node.type) {
            case "text":
                return node.text;
            case "bold":
                return <strong key={index}>{renderNodes(node.children, myUsername)}</strong>;
            case "italic":
                return <em key={index}>{renderNodes(node.children, myUsername)}</em>;
            case "underline":
                return <u key={index}>{renderNodes(node.children, myUsername)}</u>;
            case "strike":
                return <s key={index}>{renderNodes(node.children, myUsername)}</s>;
            case "spoiler":
                return <Spoiler key={index}>{renderNodes(node.children, myUsername)}</Spoiler>;
            case "code":
                return <code key={index} className="inline-code">{node.text}</code>;
            case "codeblock":
                return <pre key={index} className="code-block"><code>{node.text}</code></pre>;
            case "link":
                return <a key={index} href={node.url} target="_blank" rel="noopener noreferrer">{node.url}</a>;
            case "mention": {
                const isMe = node.username.toLowerCase() === myUsername.toLowerCase();
                return <span key={index} className={isMe ? "mention me" : "mention"}>@{node.username}</span>;
            }
        }
    });
}

/** Liens d'invitation Tangzer présents dans le message (pour afficher une carte). */
function inviteCodes(nodes: MdNode[]): string[] {
    const codes: string[] = [];
    for (const node of nodes) {
        if (node.type === "link" && node.url.startsWith(window.location.origin)) {
            const code = parseInviteCode(node.url);
            if (code && !codes.includes(code)) {
                codes.push(code);
            }
        }
    }
    return codes.slice(0, 2);
}

/** Contenu d'un message mis en forme, avec les cartes d'invitation éventuelles. */
export default function MessageText({ content, myUsername }: { content: string; myUsername: string }) {
    const nodes = parseMarkdown(content);
    return (
        <>
            {renderNodes(nodes, myUsername)}
            {inviteCodes(nodes).map((code) => <InviteEmbed key={code} code={code} />)}
        </>
    );
}
