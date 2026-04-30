import { Link, useLocation } from "react-router-dom";

export default function MobileNavbar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="mobile-nav d-lg-none">

            <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
                <i className={`bi ${isActive("/") ? "bi-house-fill" : "bi-house"}`}></i>
                <small>Inicio</small>
            </Link>

            <Link to="/inventory" className={`nav-item ${isActive("/inventory") ? "active" : ""}`}>
                <i className={`bi ${isActive("/inventory") ? "bi-box-fill" : "bi-box"}`}></i>
                <small>Inventario</small>
            </Link>

            <Link to="/wishlist" className={`nav-item ${isActive("/wishlist") ? "active-pink" : ""}`}>
                <i className={`bi ${isActive("/wishlist") ? "bi-heart-fill" : "bi-heart"}`}></i>
                <small>Wishlist</small>
            </Link>

            <Link to="/chat" className={`nav-item ${isActive("/chat") ? "active" : ""}`}>
                <i className={`bi ${isActive("/chat") ? "bi-chat-dots-fill" : "bi-chat-dots"}`}></i>
                <small>Chats</small>
            </Link>

            <Link to="/profile" className={`nav-item ${isActive("/profile") ? "active" : ""}`}>
                <i className={`bi ${isActive("/profile") ? "bi-person-fill" : "bi-person"}`}></i>
                <small>Cuenta</small>
            </Link>

            <style>{`
                .active-pink { color: #ff4b91 !important; }
                .active-pink i { transform: translateY(-2px); transition: transform 0.2s ease; }
            `}</style>

        </nav>
    );
}