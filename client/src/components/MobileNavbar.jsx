import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function MobileNavbar({ user, totalUnread }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    if (!user) {
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
                    <div className="rounded-pill px-3 py-1 d-flex align-items-center justify-content-center shadow-emerald"
                        style={{ background: "linear-gradient(135deg, var(--pocky-primary), var(--pocky-primary-dark))", minWidth: "60px" }}>
                        <small className="fw-bold text-white" style={{ fontSize: "0.65rem" }}>Unirme</small>
                    </div>
                </button>
            </nav>
        );
    }

    return (
        <nav className="mobile-nav d-lg-none">
            <Link to="/" className={`nav-item ${isActive("/") && !location.search.includes("tab=tcg") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/") && !location.search.includes("tab=tcg") ? "bi-compass-fill" : "bi-compass"}`}></i>
                <small className="fw-bold">Explorar</small>
            </Link>


            <Link to="/collection" className={`nav-item ${isActive("/collection") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/collection") ? "bi-box-fill" : "bi-box"}`}></i>
                <small className="fw-bold">Mi Pocky</small>
            </Link>

            <Link to="/activity" className={`nav-item position-relative ${isActive("/activity") ? "active-emerald" : ""}`}>
                <i className={`bi ${isActive("/activity") ? "bi-people-fill" : "bi-people"}`}></i>
                <small className="fw-bold">Comunidad</small>
                {totalUnread > 0 && <span className="position-absolute top-0 start-50 ms-2 badge rounded-pill bg-warning text-dark border border-dark border-1" style={{ fontSize: '0.6rem' }}>{totalUnread}</span>}
            </Link>

            <Link to="/profile" className={`nav-item ${isActive("/profile") ? "active-emerald" : ""}`}>
                <div className="rounded-circle overflow-hidden mx-auto mb-1 border border-white border-opacity-20 shadow-sm" style={{ width: "26px", height: "26px" }}>
                    <img
                        src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName || 'User'}&background=111827&color=fff`}
                        className="w-100 h-100 object-fit-cover"
                        alt="Profile"
                    />
                </div>
                <small className="fw-bold">Perfil</small>
            </Link>
        </nav>
    );
}
