import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";

export default function MobileNavbar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="mobile-nav d-lg-none">

            <Link to="/" className={`nav-item ${isActive("/") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/") ? "bi-house-fill" : "bi-house"}`}></i>
                <small className="fw-bold">TCG</small>
            </Link>

            <Link to="/inventory" className={`nav-item ${isActive("/inventory") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/inventory") ? "bi-box-fill" : "bi-box"}`}></i>
                <small className="fw-bold">Inventario</small>
            </Link>

            <Link to="/wishlist" className={`nav-item ${isActive("/wishlist") ? "active-pink" : ""}`}>
                <i className={`bi ${isActive("/wishlist") ? "bi-heart-fill" : "bi-heart"}`}></i>
                <small className="fw-bold">Wishlist</small>
            </Link>

            <Link to="/feed" className={`nav-item ${isActive("/feed") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/feed") ? "bi-rss-fill" : "bi-rss"}`}></i>
                <small className="fw-bold">Feed</small>
            </Link>

            <Link to="/chats" className={`nav-item ${isActive("/chats") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/chats") ? "bi-chat-left-dots-fill" : "bi-chat-left-dots"}`}></i>
                <small className="fw-bold">Mensajes</small>
            </Link>

            <Link to="/profile" className={`nav-item ${isActive("/profile") ? "active-emerald" : ""}`}>
                <div className="rounded-circle overflow-hidden mx-auto mb-1 border border-white border-opacity-10" style={{ width: "24px", height: "24px" }}>
                    <img 
                        src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName || 'User'}&background=10b981&color=fff`} 
                        className="w-100 h-100 object-fit-cover"
                        alt="Profile"
                    />
                </div>
                <small className="fw-bold">Cuenta</small>
            </Link>

            <style>{`
                .nav-item i { transition: transform 0.2s ease; }
                .nav-item:active i { transform: scale(0.9); }
            `}</style>

        </nav>
    );
}