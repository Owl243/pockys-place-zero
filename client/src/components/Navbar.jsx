import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { logout } from "../services/authService";

export default function Navbar({ user, totalUnread }) {
    const location = useLocation();
    const navigate = useNavigate();

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
                    <span className="fw-bold tracking-tight text-white">Pocky's Place</span>
                </Link>

                {/* 🔗 Desktop Links */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto gap-2">
                        <li className="nav-item">
                            <Link className={`nav-link px-3 rounded-pill ${isActive("/") ? "active active-emerald fw-bold" : "text-white-80"}`} to="/">
                                Explorar
                            </Link>
                        </li>
                        {user && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link px-3 rounded-pill ${isActive("/collection") ? "active active-emerald fw-bold" : "text-white-80"}`} to="/collection">
                                        Mi Pocky
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link px-3 rounded-pill position-relative ${isActive("/activity") ? "active active-emerald fw-bold" : "text-white-80"}`} to="/activity">
                                        Comunidad
                                        {totalUnread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark border border-dark border-2" style={{ fontSize: '0.6rem' }}>{totalUnread}</span>}
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                <div className="ms-auto d-flex align-items-center gap-3">
                    {user ? (
                        <>
                            <div className="dropdown">
                                <button className="btn btn-outline-secondary btn-sm rounded-circle p-0" style={{ width: "38px", height: "38px", overflow: "hidden" }} data-bs-toggle="dropdown">
                                    <img src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName || 'User'}&background=10b981&color=fff`} className="w-100 h-100 object-fit-cover" alt="Profile" />
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2">
                                    <li className="px-3 py-2"><p className="mb-0 small text-muted">Sesión como</p><p className="mb-0 fw-bold">{auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0]}</p></li>
                                    <li><hr className="dropdown-divider opacity-50" /></li>
                                    <li><Link className="dropdown-item py-2" to="/profile"><i className="bi bi-person me-2"></i> Mi Perfil</Link></li>
                                    <li><button className="dropdown-item py-2 text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión</button></li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-sm rounded-pill px-3 py-2 text-white" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", fontSize: "0.85rem" }} onClick={() => navigate("/auth", { state: { mode: "login" } })}>Entrar</button>
                            <button className="btn btn-sm rounded-pill px-3 py-2 fw-bold text-white shadow-emerald" style={{ background: "linear-gradient(135deg,#10b981,#059669)", border: "none", fontSize: "0.85rem" }} onClick={() => navigate("/auth", { state: { mode: "register" } })}>Unirme</button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}