import { auth } from "../firebase";
import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getInventory } from "../services/inventoryService";
import { uploadProfileImage } from "../services/profileService";

export default function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL);
    const [stats, setStats] = useState({
        inventory: 0,
        wishlist: 0,
        selling: 0,
    });

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) return;

            setPhotoURL(user.photoURL);

            const data = await getInventory(user.uid);

            setStats({
                inventory: data.filter(c => c.inInventory).length,
                wishlist: data.filter(c => c.inWishlist).length,
                selling: data.filter(c => c.forSale).length,
            });
        };

        load();
    }, []);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadProfileImage(file, auth.currentUser);
            setPhotoURL(url);
            // No alert needed, visual feedback is enough
        } catch (err) {
            console.error(err);
            alert("Error al subir imagen. ¿Configuraste el CORS en Firebase?");
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/auth");
    };

    return (
        <div className="container">

            {/* 👤 Header */}
            <div className="text-center mb-5 mt-3">
                <div 
                    className="avatar-container mb-3" 
                    onClick={() => !uploading && fileInputRef.current.click()}
                    title="Cambiar foto de perfil"
                >
                    <img
                        src={photoURL || "https://via.placeholder.com/120"}
                        className={`avatar-img ${uploading ? 'opacity-25' : ''}`}
                        alt="Avatar"
                    />
                    {!uploading && (
                        <div className="avatar-overlay">
                            <i className="bi bi-camera-fill fs-2"></i>
                        </div>
                    )}
                    {uploading && (
                        <div className="spinner-border text-primary uploading-spinner" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                />

                <h4 className="fw-bold mb-0">{auth.currentUser?.displayName || "Usuario"}</h4>
                <p className="text-muted small">{auth.currentUser?.email}</p>
            </div>

            {/* 📊 Stats */}
            <div className="row text-center mb-5 g-3">
                <div className="col-4">
                    <div className="profile-stat-card">
                        <h4 className="stat-value">{stats.inventory}</h4>
                        <small className="stat-label">Colección</small>
                    </div>
                </div>

                <div className="col-4">
                    <div className="profile-stat-card">
                        <h4 className="stat-value">{stats.wishlist}</h4>
                        <small className="stat-label">Wishlist</small>
                    </div>
                </div>

                <div className="col-4">
                    <div className="profile-stat-card">
                        <h4 className="stat-value">{stats.selling}</h4>
                        <small className="stat-label">Ventas</small>
                    </div>
                </div>
            </div>

            {/* ⚙️ Acciones */}
            <div className="d-grid gap-3">
                <button className="btn-profile-primary">
                    <i className="bi bi-pencil-square me-2"></i> Editar Perfil
                </button>

                <button className="btn-profile-secondary">
                    <i className="bi bi-gear-fill me-2"></i> Configuración
                </button>

                <button className="btn-profile-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                </button>
            </div>
        </div>
    );
}