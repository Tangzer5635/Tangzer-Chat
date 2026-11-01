import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/auth";
import { ChatProvider } from "./context/ChatContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import DirectMessages from "./pages/DirectMessages";
import Rooms from "./pages/Rooms";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

function AppRoutes() {
    const { user } = useAuth();

    return (
        // On repart d'un état vide à chaque changement d'utilisateur.
        <ChatProvider key={user?.id ?? "anonyme"}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<AppLayout />}>
                        <Route index element={<Navigate to="/app/chat" replace />} />
                        <Route path="chat" element={<Chat />} />
                        <Route path="dm" element={<DirectMessages />} />
                        <Route path="rooms" element={<Rooms />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
        </ChatProvider>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
