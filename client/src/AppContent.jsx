import { useLocation, Routes, Route, Navigate, Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import Navbar from "./components/Navbar";
import MobileNavbar from "./components/MobileNavbar";
import NotificationPanel from "./components/NotificationPanel";

import Search from "./pages/Search";
import Inventory from "./pages/Inventory";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Chats from "./pages/Chats";
import Auth from "./pages/Auth";

import { listenNotifications } from "./services/notificationService";

export default function AppContent() {
    const location = useLocation();

    const hideNavbar = location.pathname === "/auth";

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        let unsubNotifs = () => {};
        if (user) {
            try {
                unsubNotifs = listenNotifications(user.uid, (data) => {
                    setNotifCount(data.filter(n => !n.read).length);
                });
            } catch (err) {
                console.error("Error listening to notifications:", err);
            }
        }
        return () => unsubNotifs();
    }, [user]);

    if (loading) {
        return <p className="text-center mt-5">Cargando app...</p>;
    }

    return (
        <>
            {!hideNavbar && (
                <div className="d-none d-lg-block">
                    <Navbar onToggleNotifs={() => setShowNotifs(!showNotifs)} notifCount={notifCount} />
                </div>
            )}

            {/* Campana de notificaciones flotante para móvil */}
            {!hideNavbar && (
                <button 
                    className="btn btn-dark bg-opacity-80 border-white border-opacity-10 rounded-circle p-2 position-fixed shadow-lg hover-scale-110 transition-all d-lg-none"
                    style={{ top: "20px", right: "20px", width: "45px", height: "45px", zIndex: 900 }}
                    onClick={() => setShowNotifs(!showNotifs)}
                >
                    <i className="bi bi-bell-fill text-warning fs-5"></i>
                    {notifCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold border border-dark border-2" style={{ fontSize: '0.65rem' }}>
                            {notifCount}
                        </span>
                    )}
                </button>
            )}

            <NotificationPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />

            <div className="container mt-4 mb-5">
                <Routes>
                    <Route
                        path="/auth"
                        element={
                            user ? <Navigate to="/" /> : <Auth />
                        }
                    />
                    <Route path="/" element={user ? <Search /> : <Navigate to="/auth" />} />
                    <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/auth" />} />
                    <Route path="/wishlist" element={user ? <Wishlist /> : <Navigate to="/auth" />} />
                    <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/auth" />} />
                    <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
                    <Route path="/feed" element={user ? <Feed /> : <Navigate to="/auth" />} />
                    <Route path="/chats" element={user ? <Chats /> : <Navigate to="/auth" />} />
                </Routes>
            </div>

            {!hideNavbar && <MobileNavbar />}
        </>
    );
}
