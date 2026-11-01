import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import { nextTabIndex } from "../../lib/tabs";

export interface TabItem<T extends string> {
    id: T;
    label: ReactNode;
}

interface TabsProps<T extends string> {
    /** Nom du groupe d'onglets, lu par les lecteurs d'écran. */
    label: string;
    tabs: TabItem<T>[];
    value: T;
    onChange: (id: T) => void;
    orientation?: "horizontal" | "vertical";
    /** Contenu de l'onglet sélectionné. */
    children: ReactNode;
    className?: string;
}

/**
 * Onglets accessibles (motif ARIA « tabs ») : un seul onglet dans l'ordre
 * de tabulation, les flèches passent d'un onglet à l'autre, Début et Fin
 * vont au premier et au dernier.
 */
export default function Tabs<T extends string>({ label, tabs, value, onChange, orientation = "horizontal", children, className }: TabsProps<T>) {
    const baseId = useId();
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const tabId = (id: T) => `${baseId}-onglet-${id}`;
    const panelId = `${baseId}-panneau`;

    const onKeyDown = (e: KeyboardEvent) => {
        const current = tabs.findIndex((tab) => tab.id === value);
        const next = nextTabIndex(e.key, current, tabs.length, orientation);
        if (next !== null) {
            e.preventDefault();
            onChange(tabs[next].id);
            buttons.current[next]?.focus();
        }
    };

    return (
        <div className={`tabs-container tabs-${orientation}${className ? ` ${className}` : ""}`}>
            <div className="tabs" role="tablist" aria-label={label} aria-orientation={orientation} onKeyDown={onKeyDown}>
                {tabs.map((tab, index) => (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            buttons.current[index] = el;
                        }}
                        type="button"
                        role="tab"
                        id={tabId(tab.id)}
                        className="tab"
                        aria-selected={tab.id === value}
                        aria-controls={panelId}
                        tabIndex={tab.id === value ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tab-panel" role="tabpanel" id={panelId} aria-labelledby={tabId(value)} tabIndex={0}>
                {children}
            </div>
        </div>
    );
}
