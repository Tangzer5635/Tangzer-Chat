import type { ReactNode } from "react";

/** Mise en page commune aux pages de connexion et d'inscription. */
export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="login-page">
            <div className="login-brand">
                <img src="/favicon.jpg" alt="Tangzer" className="login-logo" />
                <h1>Tangzer</h1>
                <p>
                    Tes serveurs, tes salons, tes potes.
                    <br />
                    En temps réel.
                </p>
            </div>

            <div className="login-form-side">
                <div className="login-box">{children}</div>
            </div>
        </div>
    );
}
