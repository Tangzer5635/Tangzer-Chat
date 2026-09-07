import { Navigate, Outlet } from "react-router-dom";

import { useChatContext } from "../context/ChatContext";
export default function ProtectedRoute() {

    const token = localStorage.getItem("jwt");
    const { currentUser } = useChatContext();

    if (!token || !currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}