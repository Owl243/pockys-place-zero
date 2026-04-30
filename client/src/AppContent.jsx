import { useLocation, Routes, Route } from "react-router-dom";

import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import Navbar from "./components/Navbar";
import MobileNavbar from "./components/MobileNavbar";

import Search from "./pages/Search";
import Inventory from "./pages/Inventory";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";

import { Navigate } from "react-router-dom";

export default function AppContent() {
    const location = useLocation();

    const hideNavbar = location.pathname === "/auth";

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    if (loading) {
        return <p className="text-center mt-5">Cargando app...</p>;
    }

    return (
        <>
            {!hideNavbar && (
                <div className="d-none d-lg-block">
                    <Navbar />
                </div>
            )}

            <div className="container mt-4 mb-5">
                <Routes>
                    <Route
                        path="/auth"
                        element={
                            user ? <Navigate to="/" /> : <Auth />
                        }
                    />
                    <Route path="/" element={<Search />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/chat" element={<Chat />} />
                </Routes>
            </div>

            {!hideNavbar && <MobileNavbar />}
        </>
    );

}
