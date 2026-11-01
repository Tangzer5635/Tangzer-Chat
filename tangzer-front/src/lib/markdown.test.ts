import { describe, expect, it } from "vitest";

import { mentionsUser, parseMarkdown, toPlainText } from "./markdown";

const text = (t: string) => ({ type: "text", text: t });

describe("parseMarkdown", () => {
    it("laisse le texte simple tel quel", () => {
        expect(parseMarkdown("bonjour")).toEqual([text("bonjour")]);
    });

    it("gère gras, italique, souligné, barré et spoiler", () => {
        expect(parseMarkdown("un **gros** mot")).toEqual([
            text("un "), { type: "bold", children: [text("gros")] }, text(" mot"),
        ]);
        expect(parseMarkdown("*penché* __souligné__ ~~barré~~ ||secret||")).toEqual([
            { type: "italic", children: [text("penché")] },
            text(" "),
            { type: "underline", children: [text("souligné")] },
            text(" "),
            { type: "strike", children: [text("barré")] },
            text(" "),
            { type: "spoiler", children: [text("secret")] },
        ]);
    });

    it("imbrique les styles", () => {
        expect(parseMarkdown("**gras et *italique***")).toEqual([
            { type: "bold", children: [text("gras et "), { type: "italic", children: [text("italique")] }] },
        ]);
    });

    it("n'interprète rien dans le code", () => {
        expect(parseMarkdown("lance `npm **run** dev`")).toEqual([
            text("lance "), { type: "code", text: "npm **run** dev" },
        ]);
        expect(parseMarkdown("```js\nconst a = **1**;\n```")).toEqual([
            { type: "codeblock", lang: "js", text: "const a = **1**;" },
        ]);
    });

    it("détecte les liens sans la ponctuation finale", () => {
        expect(parseMarkdown("va sur https://tangzer.lan/invite/abc.")).toEqual([
            text("va sur "), { type: "link", url: "https://tangzer.lan/invite/abc" }, text("."),
        ]);
    });

    it("détecte les mentions mais pas les adresses mail", () => {
        expect(parseMarkdown("salut @Tanguy !")).toEqual([
            text("salut "), { type: "mention", username: "Tanguy" }, text(" !"),
        ]);
        expect(parseMarkdown("écris à moi@exemple.fr")).toEqual([text("écris à moi@exemple.fr")]);
    });

    it("laisse les marqueurs non fermés en texte", () => {
        expect(parseMarkdown("2 ** 3 et un * seul")).toEqual([text("2 ** 3 et un * seul")]);
    });
});

describe("mentionsUser", () => {
    it("reconnaît une mention quelle que soit la casse", () => {
        expect(mentionsUser("hé @TANGUY", "tanguy")).toBe(true);
        expect(mentionsUser("hé @tanguy2", "tanguy")).toBe(false);
        expect(mentionsUser("mail@tanguy.fr", "tanguy")).toBe(false);
    });
});

describe("toPlainText", () => {
    it("retire la mise en forme et cache les spoilers", () => {
        expect(toPlainText("**Salut** @Tanguy, `npm i` ||fin du film||\n```\ncode\n```"))
            .toBe("Salut @Tanguy, npm i ▒▒▒▒ code");
    });
});
