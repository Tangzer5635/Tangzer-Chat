import { useId, type ReactNode } from "react";

/** Attributs à poser sur le champ pour le relier à son libellé, son aide et son erreur. */
export interface FieldControlProps {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
}

interface FieldProps {
    label: ReactNode;
    /** Identifiant du champ (sinon généré). */
    id?: string;
    /** Texte d'aide affiché sous le libellé. */
    hint?: ReactNode;
    /** Message d'erreur propre à ce champ. */
    error?: string | null;
    children: (control: FieldControlProps) => ReactNode;
}

/**
 * Champ de formulaire accessible : libellé visible, aide et erreur annoncées
 * par les lecteurs d'écran (aria-describedby), état invalide signalé.
 *
 *   <Field label="Nom du serveur" hint="2 à 50 caractères">
 *       {(control) => <input {...control} value={name} onChange={…} />}
 *   </Field>
 */
export default function Field({ label, id: fixedId, hint, error, children }: FieldProps) {
    const generatedId = useId();
    const id = fixedId ?? generatedId;
    const hintId = `${id}-aide`;
    const errorId = `${id}-erreur`;
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

    return (
        <div className={error ? "field field-invalid" : "field"}>
            <label htmlFor={id}>{label}</label>
            {hint && <p id={hintId} className="field-hint">{hint}</p>}
            {children({
                id,
                "aria-describedby": describedBy || undefined,
                "aria-invalid": error ? true : undefined,
            })}
            {error && <p id={errorId} className="field-error">{error}</p>}
        </div>
    );
}
