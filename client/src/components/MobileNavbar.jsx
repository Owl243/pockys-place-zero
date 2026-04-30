import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MobileNavbar() {
    const location = useLocation();
    const [count, setCount] = useState(0);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="mobile-nav d-lg-none">

            <Link to="/wishlist" className={`nav-item ${isActive("/wishlist") ? "active" : ""}`}>
                <i className="bi bi-heart"></i>
                <small>Wishlist</small>
            </Link>

            <Link to="/chat" className={`nav-item ${isActive("/chat") ? "active" : ""}`}>
                <i className="bi bi-chat-dots"></i>
                <small>Chats</small>
            </Link>

            <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
                <i className="bi bi-grid"></i>
                <small>TCG</small>
            </Link>

            <Link to="/inventory" className={`nav-item ${isActive("/inventory") ? "active" : ""}`}>
                <i className="bi bi-box"></i>
                <small>Inventario</small>
            </Link>

            <Link to="/profile" className={`nav-item ${isActive("/profile") ? "active" : ""}`}>
                <i className="bi bi-person"></i>
                <small>Cuenta</small>
            </Link>

        </nav>
    );
}