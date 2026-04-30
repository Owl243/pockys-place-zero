import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { logout } from "../services/authService";

export default function Navbar() {
    const [count, setCount] = useState(0);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container">

                <Link className="navbar-brand fw-bold text-success" to="/">
                    PokeMarket
                </Link>

                <div className="ms-auto d-flex align-items-center gap-3">

                    {/* 🔔 Notificaciones */}
                    <Link to="/notifications" className="text-light">
                        <i className="bi bi-bell"></i>
                    </Link>

                    {/* 👤 Usuario dropdown */}
                    <div className="dropdown">
                        <button
                            className="btn btn-emerald dropdown-toggle"
                            data-bs-toggle="dropdown"
                        >
                            {auth.currentUser?.email?.split("@")[0] || "Cuenta"}
                        </button>

                        <ul className="dropdown-menu dropdown-menu-end">

                            <li>
                                <Link className="dropdown-item" to="/profile">
                                    Perfil
                                </Link>
                            </li>

                            <li>
                                <Link className="dropdown-item" to="/inventory">
                                    Inventario
                                </Link>
                            </li>

                            <li>
                                <Link className="dropdown-item" to="/wishlist">
                                    Wishlist
                                </Link>
                            </li>

                            <li><hr className="dropdown-divider" /></li>

                            <li>
                                <button className="dropdown-item text-danger" onClick={handleLogout}>
                                    Cerrar sesión
                                </button>
                            </li>

                        </ul>
                    </div>

                </div>
            </div>
        </nav>
    );
}