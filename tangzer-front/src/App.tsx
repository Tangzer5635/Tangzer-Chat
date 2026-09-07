import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import "./App.css";

import { ChatProvider } from "./context/ChatContext";

import Login from "./pages/Login";
import Chat from "./pages/Chat";
import DirectMessages from "./pages/DirectMessages";
import Rooms from "./pages/Rooms";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

export default function App() {

    return (
        <ChatProvider>

            <BrowserRouter>

                <Routes>

                    {/* =========================
                        PAGE PUBLIQUE
                       ========================= */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />


                    {/* =========================
                        PAGES PROTEGEES
                       ========================= */}

                    <Route element={<ProtectedRoute />}>

                        <Route
                            path="/app"
                            element={<AppLayout />}
                        >

                            {/* /app → /app/chat */}
                            <Route
                                index
                                element={
                                    <Navigate
                                        to="/app/chat"
                                        replace
                                    />
                                }
                            />

                            {/* Chat public */}
                            <Route
                                path="chat"
                                element={<Chat />}
                            />

                            {/* Messages privés */}
                            <Route
                                path="dm"
                                element={<DirectMessages />}
                            />

                            {/* Salons */}
                            <Route
                                path="rooms"
                                element={<Rooms />}
                            />

                        </Route>

                    </Route>


                    {/* =========================
                        ROUTE PAR DEFAUT
                       ========================= */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/app/chat"
                                replace
                            />
                        }
                    />

                </Routes>

            </BrowserRouter>

        </ChatProvider>
    );
}