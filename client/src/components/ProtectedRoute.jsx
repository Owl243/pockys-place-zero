import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, user, loading }) {
    if (loading) {
        return <p className="text-center mt-5">Cargando...</p>;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}