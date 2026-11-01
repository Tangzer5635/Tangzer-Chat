import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

import Toasts from "./components/Toasts";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppShell from "./layout/AppShell";
import DirectMessagesPage from "./pages/DirectMessagesPage";
import ExplorePage from "./pages/ExplorePage";
import HomeRedirect from "./pages/HomeRedirect";
import InvitePage from "./pages/InvitePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ServerPage from "./pages/ServerPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path="/invite/:code" element={<InvitePage />} />

                            <Route path="/app" element={<AppShell />}>
                                <Route index element={<HomeRedirect />} />
                                <Route path="servers/:serverId" element={<ServerPage />} />
                                <Route path="servers/:serverId/channels/:channelId" element={<ServerPage />} />
                                <Route path="explore" element={<ExplorePage />} />
                                <Route path="dm" element={<DirectMessagesPage />} />
                                <Route path="dm/:channelId" element={<DirectMessagesPage />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<Navigate to="/app" replace />} />
                    </Routes>
                    <Toasts />
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}
