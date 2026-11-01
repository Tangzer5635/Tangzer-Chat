import type { ReactNode } from "react";

import Logo from "../components/Logo";
import { APP_NAME, APP_TAGLINE } from "../lib/brand";

/** Mise en page commune aux pages de connexion et d'inscription. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="login-page">
            <div className="login-brand">
                <Logo size={72} />
                <h1>{APP_NAME}</h1>
                <p>{APP_TAGLINE}</p>
            </div>

            <main className="login-form-side">
                <div className="login-box">{children}</div>
            </main>
        </div>
    );
}
