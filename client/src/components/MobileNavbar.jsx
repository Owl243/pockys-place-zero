import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function MobileNavbar({ user }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    if (!user) {
        // Guest: bottom bar simplificado con CTA de registro
        return (
            <nav className="mobile-nav d-lg-none">
                <Link to="/" className={`nav-item ${isActive("/") ? "active-emerald" : ""}`}>
                    <i className={`bi ${isActive("/") ? "bi-compass-fill" : "bi-compass"}`}></i>
                    <small className="fw-bold">Explorar</small>
                </Link>

                <button
                    className="nav-item border-0"
                    style={{ background: "transparent", color: "inherit" }}
                    onClick={() => navigate("/auth", { state: { mode: "login" } })}
                >
                    <i className="bi bi-box-arrow-in-right" style={{ color: "rgba(255,255,255,0.4)" }}></i>
                    <small className="fw-bold" style={{ color: "rgba(255,255,255,0.4)" }}>Entrar</small>
                </button>

                <button
                    className="nav-item border-0"
                    style={{ background: "transparent" }}
                    onClick={() => navigate("/auth", { state: { mode: "register" } })}
                >
                    <div className="rounded-pill px-2 py-1 d-flex align-items-center justify-content-center"
                        style={{ background: "linear-gradient(135deg,#10b981,#059669)", minWidth: "52px" }}>
                        <small className="fw-bold text-white" style={{ fontSize: "0.6rem", whiteSpace: "nowrap" }}>+ Unirme</small>
                    </div>
                </button>

                <style>{`
                    .nav-item i { transition: transform 0.2s ease; }
                    .nav-item:active i { transform: scale(0.9); }
                `}</style>
            </nav>
        );
    }

    return (
        <nav className="mobile-nav d-lg-none">

            <Link to="/" className={`nav-item ${isActive("/") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/") ? "bi-compass-fill" : "bi-compass"}`}></i>
                <small className="fw-bold">Explorar</small>
            </Link>

            <Link to="/search" className={`nav-item ${isActive("/search") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/search") ? "bi-house-fill" : "bi-house"}`}></i>
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