import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { logout } from "../services/authService";

export default function Navbar({ onToggleNotifs }) {
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg sticky-top py-3">
            <div className="container">

                <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                    <div className="bg-emerald p-1 rounded-2">
                        <i className="bi bi-intersect text-white fs-4"></i>
                    </div>
                    <span className="fw-bold tracking-tight text-white">PokeMarket</span>
                </Link>

                {/* 🔗 Desktop Links */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto gap-2">
                        <li className="nav-item">
                            <Link className={`nav-link px-3 rounded-pill ${isActive("/") ? "active text-emerald fw-bold" : "text-secondary"}`} to="/">
                                TCG
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-3 rounded-pill ${isActive("/inventory") ? "active text-emerald fw-bold" : "text-secondary"}`} to="/inventory">
                                Inventario
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-3 rounded-pill ${isActive("/wishlist") ? "active text-emerald fw-bold" : "text-secondary"}`} to="/wishlist">
                                Wishlist
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-3 rounded-pill ${isActive("/chat") ? "active text-emerald fw-bold" : "text-secondary"}`} to="/chat">
                                Chats
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="ms-auto d-flex align-items-center gap-3">

                    {/* 🔔 Notificaciones (Botón que abre panel flotante) */}
                    <button 
                        onClick={onToggleNotifs}
                        className="btn btn-link text-secondary p-0 hover-emerald"
                    >
                        <i className="bi bi-bell fs-5"></i>
                    </button>

                    {/* 👤 Usuario dropdown */}
                    <div className="dropdown">
                        <button
                            className="btn btn-outline-secondary btn-sm rounded-circle p-0"
                            style={{ width: "38px", height: "38px", overflow: "hidden" }}
                            data-bs-toggle="dropdown"
                        >
                            <img 
                                src={auth.currentUser?.photoURL || "https://via.placeholder.com/40"} 
                                className="w-100 h-100 object-fit-cover"
                                alt="Profile"
                            />
                        </button>

                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2">
                            <li className="px-3 py-2">
                                <p className="mb-0 small text-muted">Sesión como</p>
                                <p className="mb-0 fw-bold">{auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0]}</p>
                            </li>
                            <li><hr className="dropdown-divider opacity-50" /></li>
                            <li>
                                <Link className="dropdown-item py-2" to="/profile">
                                    <i className="bi bi-person me-2"></i> Mi Perfil
                                </Link>
                            </li>
                            <li>
                                <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
                                </button>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </nav>
    );
}