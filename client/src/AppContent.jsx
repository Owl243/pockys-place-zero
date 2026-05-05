import { useLocation, Routes, Route, Navigate } from "react-router-dom";

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
import PublicFeed from "./pages/PublicFeed";
import Welcome from "./pages/Welcome";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

import { listenNotifications } from "./services/notificationService";

export default function AppContent() {
    const location = useLocation();

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
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-grow text-emerald" role="status"></div>
            </div>
        );
    }

    const hideNavbar = location.pathname === "/auth";
    const isPublicRoute = location.pathname === "/explore";

    return (
        <>
            {!hideNavbar && (
                <div className="d-none d-lg-block">
                    <Navbar
                        user={user}
                        onToggleNotifs={() => setShowNotifs(!showNotifs)}
                        notifCount={notifCount}
                    />
                </div>
            )}

            {/* Campana flotante móvil — solo para usuarios autenticados */}
            {!hideNavbar && user && (
                <button
                    className="btn btn-dark bg-opacity-80 border-white border-opacity-10 rounded-circle p-2 position-fixed shadow-lg transition-all d-lg-none"
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

            <div className={isPublicRoute ? "" : "container mt-4 mb-5"}>
                <Routes>
                    {/* ─── Ruta pública ─── */}
                    <Route path="/" element={<PublicFeed user={user} />} />
                    <Route path="/explore" element={<PublicFeed user={user} />} />

                    {/* ─── Legal ─── */}
                    <Route path="/legal/privacy" element={<Privacy />} />
                    <Route path="/legal/terms" element={<Terms />} />

                    {/* ─── Auth ─── */}
                    <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />

                    {/* ─── Post-registro onboarding ─── */}
                    <Route path="/welcome" element={user ? <Welcome /> : <Navigate to="/auth" />} />

                    {/* ─── Rutas protegidas ─── */}
                    <Route path="/search" element={user ? <Search /> : <Navigate to="/auth" />} />
                    <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/auth" />} />
                    <Route path="/wishlist" element={user ? <Wishlist /> : <Navigate to="/auth" />} />
                    <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/auth" />} />
                    <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
                    <Route path="/feed" element={user ? <Feed /> : <Navigate to="/auth" />} />
                    <Route path="/chats" element={user ? <Chats /> : <Navigate to="/auth" />} />
                </Routes>
            </div>

            {!hideNavbar && <MobileNavbar user={user} />}
        </>
    );
}
