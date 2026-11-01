import { Menu, Search, X } from "lucide-react";
import { Link } from "react-router-dom";

import AccountMenu from "./AccountMenu";
import Logo from "./Logo";

interface AppHeaderProps {
    navOpen: boolean;
    onToggleNav: () => void;
    onSearch: () => void;
    navId: string;
}

/** En-tête : bouton de navigation (téléphone), logo, recherche rapide, menu du compte. */
export default function AppHeader({ navOpen, onToggleNav, onSearch, navId }: AppHeaderProps) {
    return (
        <header className="app-header">
            <button
                className="icon-button app-nav-toggle"
                onClick={onToggleNav}
                aria-label="Navigation"
                aria-expanded={navOpen}
                aria-controls={navId}
            >
                {navOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/app" className="app-header-brand">
                <Logo size={28} withName />
            </Link>

            <button className="app-search-button" onClick={onSearch} aria-keyshortcuts="Control+K">
                <Search size={18} />
                <span className="app-search-label">Rechercher une personne, un salon…</span>
                <kbd aria-hidden="true">Ctrl K</kbd>
            </button>

            <span className="spacer" />
            <AccountMenu />
        </header>
    );
}
