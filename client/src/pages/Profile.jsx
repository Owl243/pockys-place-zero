import { auth } from "../firebase";
import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getInventory } from "../services/inventoryService";
import { uploadProfileImage } from "../services/profileService";

const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        await uploadProfileImage(file, auth.currentUser);

        alert("Foto actualizada");

        // 🔄 refrescar UI
        window.location.reload();
    } catch (err) {
        console.error(err);
        alert("Error al subir imagen");
    }
};

export default function Profile() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        inventory: 0,
        wishlist: 0,
        selling: 0,
    });

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const data = await getInventory(user.uid);

            setStats({
                inventory: data.filter(c => c.inInventory).length,
                wishlist: data.filter(c => c.inWishlist).length,
                selling: data.filter(c => c.forSale).length,
            });
        };

        load();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate("/auth");
    };

    return (
        <div className="container">

            {/* 👤 Header */}
            <div className="text-center mb-4">
                <input
                    type="file"
                    accept="image/*"
                    className="form-control mb-3"
                    onChange={handleImage}
                />
                <img
                    src={
                        auth.currentUser?.photoURL ||
                        "https://via.placeholder.com/80"
                    }
                    className="avatar-img"
                />
                <h4>{auth.currentUser?.email}</h4>
            </div>

            {/* 📊 Stats */}
            <div className="row text-center mb-4">

                <div className="col">
                    <div className="card p-3">
                        <h5>{stats.inventory}</h5>
                        <small>Inventario</small>
                    </div>
                </div>

                <div className="col">
                    <div className="card p-3">
                        <h5>{stats.wishlist}</h5>
                        <small>Wishlist</small>
                    </div>
                </div>

                <div className="col">
                    <div className="card p-3">
                        <h5>{stats.selling}</h5>
                        <small>En venta</small>
                    </div>
                </div>

            </div>

            {/* ⚙️ Acciones */}
            <div className="d-grid gap-2">

                <button className="btn btn-outline-light">
                    Editar perfil
                </button>

                <button className="btn btn-outline-warning">
                    Configuración
                </button>

                <button className="btn btn-danger" onClick={handleLogout}>
                    Cerrar sesión
                </button>

            </div>
        </div>
    );
}