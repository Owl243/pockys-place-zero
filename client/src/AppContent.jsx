import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import Navbar from "./components/Navbar";
import MobileNavbar from "./components/MobileNavbar";

import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import PublicFeed from "./pages/PublicFeed";
import Welcome from "./pages/Welcome";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Collection from "./pages/Collection";
import Activity from "./pages/Activity";
import DevToolbox from "./components/DevToolbox";

import { listenNotifications, } from "./services/notificationService";
import { listenUserChats, loadDynamicAdmins } from "./services/chatService";
import { applyTheme, DEFAULT_ROLE } from "./utils/theme";

export default function AppContent() {
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifCount, setNotifCount] = useState(0);
    const [unreadChats, setUnreadChats] = useState(0);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
            if (u) loadDynamicAdmins(); // Refrescar lista de admins en cada login
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        let unsubNotifs = () => {};
        let unsubChats = () => {};

        if (user) {
            unsubNotifs = listenNotifications(user.uid, (data) => {
                setNotifCount(data.filter(n => !n.read).length);
            });
            unsubChats = listenUserChats(user, (data) => {
                setUnreadChats(data.filter(c => c.unread?.[user.uid]).length);
            });
        }
        return () => { unsubNotifs(); unsubChats(); };
    }, [user]);

    const totalUnread = notifCount + unreadChats;

    useEffect(() => {
        if (!user) {
            applyTheme(DEFAULT_ROLE);
            return;
        }
        const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                applyTheme(snap.data().intentType || DEFAULT_ROLE);
            } else {
                applyTheme(DEFAULT_ROLE);
            }
        });
        return () => unsub();
    }, [user]);

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-grow text-emerald" role="status"></div>
            </div>
        );
    }

    const hideNavbar = ["/auth", "/welcome"].includes(location.pathname);

    return (
        <>
            {!hideNavbar && (
                <div className="d-none d-lg-block">
                    <Navbar
                        user={user}
                        totalUnread={totalUnread}
                    />
                </div>
            )}

            <div className="container mt-2 mt-md-4 mb-5">
                <Routes>
                    {/* ─── Rutas públicas ─── */}
                    <Route path="/" element={<PublicFeed user={user} />} />
                    <Route path="/feed" element={<Navigate to="/" />} />
                    <Route path="/chats" element={<Navigate to="/activity" />} />
                    <Route path="/explore" element={<PublicFeed user={user} />} />
                    <Route path="/tcg" element={<PublicFeed user={user} />} />

                    {/* ─── Legal ─── */}
                    <Route path="/legal/privacy" element={<Privacy />} />
                    <Route path="/legal/terms" element={<Terms />} />

                    {/* ─── Auth ─── */}
                    <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />

                    {/* ─── Post-registro onboarding ─── */}
                    <Route path="/welcome" element={user ? <Welcome /> : <Navigate to="/auth" />} />

                    {/* ─── Rutas protegidas ─── */}
                    <Route path="/collection" element={user ? <Collection /> : <Navigate to="/auth" />} />
                    <Route path="/activity" element={user ? <Activity /> : <Navigate to="/auth" />} />
                    <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
                </Routes>
            </div>

            {!hideNavbar && <MobileNavbar user={user} totalUnread={totalUnread} />}
            <DevToolbox user={user} />
        </>
    );
}
