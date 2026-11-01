/**
 * Mise en forme légère des messages, façon Discord :
 *   **gras**  *italique*  __souligné__  ~~barré~~  ||spoiler||
 *   `code`  ```bloc de code```  liens https://…  mentions @pseudo
 *
 * Le texte est découpé en nœuds que React affiche : jamais de HTML injecté,
 * donc aucun risque de script caché dans un message.
 */

export type MdNode =
    | { type: "text"; text: string }
    | { type: "bold" | "italic" | "underline" | "strike" | "spoiler"; children: MdNode[] }
    | { type: "code"; text: string }
    | { type: "codeblock"; text: string; lang: string | null }
    | { type: "link"; url: string }
    | { type: "mention"; username: string };

const CODE_BLOCK = /```(?:([\w+-]+)\n)?([\s\S]*?)```/g;
const INLINE_CODE = /`([^`\n]+)`/g;

/** Formats « enveloppants », du plus prioritaire au moins prioritaire. */
const WRAPPERS: { type: "bold" | "underline" | "strike" | "spoiler" | "italic"; regex: RegExp }[] = [
    // Le ** fermant ne doit pas être suivi d'une autre * : « **gras *et italique*** ».
    { type: "bold", regex: /\*\*([\s\S]+?)\*\*(?!\*)/ },
    { type: "underline", regex: /__([\s\S]+?)__/ },
    { type: "strike", regex: /~~([\s\S]+?)~~/ },
    { type: "spoiler", regex: /\|\|([\s\S]+?)\|\|/ },
    // Pas d'espace juste après la * ouvrante ni avant la * fermante : « 2 * 3 * 4 » reste du texte.
    { type: "italic", regex: /\*(?![\s*])([^*\n]+?)(?<!\s)\*/ },
];

const LINK = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]'"]/;
const MENTION = /(?<![\w@])@([A-Za-z0-9_.]{3,20})/;

export function parseMarkdown(text: string): MdNode[] {
    return splitBy(text, CODE_BLOCK, (match) => ({
        type: "codeblock",
        lang: match[1] ?? null,
        text: match[2].replace(/^\n/, "").replace(/\n$/, ""),
    }), (rest) =>
        splitBy(rest, INLINE_CODE, (match) => ({ type: "code", text: match[1] }), parseInline));
}

/** Découpe le texte selon une expression : les morceaux correspondants deviennent des nœuds. */
function splitBy(
    text: string,
    regex: RegExp,
    toNode: (match: RegExpExecArray) => MdNode,
    parseRest: (text: string) => MdNode[],
): MdNode[] {
    const nodes: MdNode[] = [];
    let last = 0;
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
            nodes.push(...parseRest(text.slice(last, match.index)));
        }
        nodes.push(toNode(match));
        last = match.index + match[0].length;
    }
    if (last < text.length) {
        nodes.push(...parseRest(text.slice(last)));
    }
    return nodes;
}

/** Cherche le premier élément de mise en forme, le traite, puis continue après. */
function parseInline(text: string): MdNode[] {
    if (!text) {
        return [];
    }

    type Candidate = { index: number; length: number; node: MdNode };
    const candidates: Candidate[] = [];

    for (const { type, regex } of WRAPPERS) {
        const match = regex.exec(text);
        if (match) {
            candidates.push({ index: match.index, length: match[0].length, node: { type, children: parseInline(match[1]) } });
        }
    }

    const link = LINK.exec(text);
    if (link) {
        candidates.push({ index: link.index, length: link[0].length, node: { type: "link", url: link[0] } });
    }

    const mention = MENTION.exec(text);
    if (mention) {
        candidates.push({ index: mention.index, length: mention[0].length, node: { type: "mention", username: mention[1] } });
    }

    if (candidates.length === 0) {
        return [{ type: "text", text }];
    }

    // Le plus tôt dans le texte gagne ; à égalité, le premier de la liste (gras avant italique).
    const first = candidates.reduce((best, c) => (c.index < best.index ? c : best));
    const nodes: MdNode[] = [];
    if (first.index > 0) {
        nodes.push({ type: "text", text: text.slice(0, first.index) });
    }
    nodes.push(first.node);
    nodes.push(...parseInline(text.slice(first.index + first.length)));
    return nodes;
}

/** Vrai si le message mentionne ce pseudo (insensible à la casse). */
export function mentionsUser(text: string, username: string): boolean {
    const target = username.toLowerCase();
    const regex = new RegExp(MENTION.source, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        if (match[1].toLowerCase() === target) {
            return true;
        }
    }
    return false;
}

/** Version texte simple d'un message (aperçus, notifications) : le spoiler reste caché. */
export function toPlainText(text: string): string {
    const flatten = (nodes: MdNode[]): string => nodes.map((node) => {
        switch (node.type) {
            case "text":
                return node.text;
            case "code":
            case "codeblock":
                return node.text;
            case "link":
                return node.url;
            case "mention":
                return `@${node.username}`;
            case "spoiler":
                return "▒▒▒▒";
            default:
                return flatten(node.children);
        }
    }).join("");
    return flatten(parseMarkdown(text)).replace(/\s+/g, " ").trim();
}
