import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Toasts from "../components/Toasts";

export default function AppLayout() {

    return (
        <div className="app-layout">
            <Navbar />
            <Toasts />
            <main className="app-content"><Outlet /></main>

        </div>
    );
}