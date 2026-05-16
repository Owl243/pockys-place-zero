import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { getInventory } from "../services/inventoryService";
import { uploadProfileImage, updateDisplayName } from "../services/profileService";
import { useToast } from "../context/ToastContext";
import { updateUserInFeed } from "../services/feedService";
import { isAdmin, isPro } from "../services/chatService";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import { applyTheme, getThemeByRole } from "../utils/theme";

export default function Profile() {
    const navigate = useNavigate();
    const showToast = useToast();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState(auth.currentUser?.displayName || "");
    const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL);
    const [stats, setStats] = useState({ inventory: 0, wishlist: 0, selling: 0 });
    const [userRole, setUserRole] = useState("sell");
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    // Admin panel state
    const [adminEmails, setAdminEmails] = useState([]);
    const [adminSearchEmail, setAdminSearchEmail] = useState("");
    const [adminSearching, setAdminSearching] = useState(false);

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) return;
            setPhotoURL(user.photoURL);
            setNewName(user.displayName || "");

            const data = await getInventory(user.uid);
            setStats({
                inventory: data.filter((card) => card.inInventory).length,
                wishlist: data.filter((card) => card.inWishlist).length,
                selling: data.filter((card) => card.forSale).length
            });

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().intentType || "sell");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        load();
    }, []);

    // Load dynamic admin list
    useEffect(() => {
        if (!isAdmin(auth.currentUser)) return;
        const fetchAdmins = async () => {
            try {
                const snap = await getDoc(doc(db, "config", "admins"));
                setAdminEmails(snap.exists() ? (snap.data().emails || []) : []);
            } catch (e) {}
        };
        fetchAdmins();
    }, []);

    const onCropComplete = useCallback((_croppedArea, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleSaveName = async () => {
        try {
            const user = auth.currentUser;
            await updateDisplayName(user, newName);
            await updateUserInFeed(user.uid, { userName: newName });
            setEditing(false);
            showToast("Nombre actualizado en todo el sitio", "success");
        } catch {
            showToast("Error al actualizar nombre", "error");
        }
    };

    const handleRoleChange = async (newRole) => {
        const user = auth.currentUser;
        if (!user) return;
        const previousRole = userRole;
        setUserRole(newRole);
        applyTheme(newRole);
        try {
            await setDoc(doc(db, "users", user.uid), { intentType: newRole }, { merge: true });
            showToast(`Rol cambiado a ${newRole === "inventory" ? "Coleccionista" : newRole === "sell" ? "Vendedor" : "Comprador"}`, "success");
        } catch {
            setUserRole(previousRole);
            applyTheme(previousRole);
            showToast("Error al cambiar rol", "error");
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImage(reader.result);
            setShowCropper(true);
        });
        reader.readAsDataURL(file);
    };

    const handleRepositionCurrent = () => {
        if (!photoURL) return;
        setImage(photoURL);
        setShowCropper(true);
    };

    const handleCropSave = async () => {
        setUploading(true);
        setShowCropper(false);
        try {
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
            const user = auth.currentUser;
            const url = await uploadProfileImage(croppedFile, user);
            await updateUserInFeed(user.uid, { userPhoto: url });
            setPhotoURL(url);
            showToast("Foto actualizada y centrada", "success");
        } catch (error) {
            console.error(error);
            showToast("Error al procesar imagen", "error");
        } finally {
            setUploading(false);
            setImage(null);
        }
    };

    useEffect(() => {
        document.body.style.overflow = showCropper ? "hidden" : "auto";
        return () => { document.body.style.overflow = "auto"; };
    }, [showCropper]);

    const handleLogout = async () => {
        await logout();
        navigate("/auth");
    };

    const handleGrantAdmin = async () => {
        const email = adminSearchEmail.trim().toLowerCase();
        if (!email || adminEmails.includes(email)) {
            showToast(email ? "Este usuario ya tiene admin" : "Ingresa un email", "warning");
            return;
        }
        setAdminSearching(true);
        try {
            const newList = [...adminEmails, email];
            await setDoc(doc(db, "config", "admins"), { emails: newList }, { merge: true });
            setAdminEmails(newList);
            setAdminSearchEmail("");
            showToast(`Admin otorgado a ${email}`, "success");
        } catch (e) {
            showToast("Error al otorgar admin", "error");
        } finally {
            setAdminSearching(false);
        }
    };

    const handleRevokeAdmin = async (email) => {
        try {
            const newList = adminEmails.filter(e => e !== email);
            await setDoc(doc(db, "config", "admins"), { emails: newList }, { merge: true });
            setAdminEmails(newList);
            showToast(`Admin revocado a ${email}`, "error");
        } catch (e) {
            showToast("Error al revocar admin", "error");
        }
    };

    return (
        <div className="container-fluid py-2 py-md-4 px-2">
            {showCropper && (
                <div className="position-fixed top-0 start-0 w-100 bg-dark d-flex flex-column animate-fade-in" style={{ zIndex: 9999, height: "100dvh" }}>
                    <div className="p-3 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 bg-dark">
                        <h6 className="text-white fw-bold mb-0">Acomodar imagen</h6>
                        <button className="btn btn-sm btn-outline-light rounded-circle border-0" onClick={() => setShowCropper(false)}><i className="bi bi-x-lg"></i></button>
                    </div>
                    <div className="flex-grow-1 position-relative bg-black" style={{ minHeight: "300px" }}>
                        <Cropper image={image} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={false} />
                    </div>
                    <div className="p-3 bg-dark border-top border-white border-opacity-10 shadow-lg pb-safe">
                        <div className="d-flex align-items-center gap-2 mb-3 mx-auto" style={{ maxWidth: "300px" }}>
                            <i className="bi bi-zoom-out text-white-50 small"></i>
                            <input type="range" className="form-range flex-grow-1" min={1} max={3} step={0.1} value={zoom} onChange={(event) => setZoom(event.target.value)} />
                            <i className="bi bi-zoom-in text-white-50 small"></i>
                        </div>
                        <div className="d-flex gap-2 justify-content-center mb-2">
                            <button className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-pill text-white border-opacity-25" onClick={() => setShowCropper(false)}>Cancelar</button>
                            <button className="btn btn-emerald btn-sm px-4 py-2 rounded-pill text-white fw-bold shadow-emerald" onClick={handleCropSave}>
                                {uploading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle-fill me-2"></i>}
                                Aplicar y guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-3 g-lg-4 align-items-stretch">
                <div className="col-12 col-lg-4">
                    <div className="p-3 p-md-4 rounded-4 h-100" style={{ background: "rgba(255,255,255,0.035)", boxShadow: "0 18px 45px rgba(0,0,0,0.18)" }}>
                        <div className="d-flex flex-column flex-sm-row flex-lg-column align-items-center align-items-lg-start text-center text-lg-start gap-3">
                            <div className="avatar-container shadow-2xl flex-shrink-0" onClick={() => !uploading && fileInputRef.current.click()} style={{ width: "110px", height: "110px", cursor: "pointer", position: "relative" }}>
                                <img src={photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName || "User"}&background=10b981&color=fff&size=128`} className={`rounded-circle border border-white border-opacity-10 w-100 h-100 object-fit-cover ${uploading ? "opacity-25" : ""}`} alt="Avatar" />
                                {!uploading && <div className="position-absolute top-50 start-50 translate-middle opacity-0 hover-opacity-100 transition-all bg-black bg-opacity-40 rounded-circle p-4 w-100 h-100 d-flex align-items-center justify-content-center"><i className="bi bi-camera-fill fs-2 text-white"></i></div>}
                                {uploading && <div className="spinner-border text-emerald position-absolute top-50 start-50 translate-middle" role="status"></div>}
                            </div>

                            <div className="flex-grow-1 w-100">
                                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                                {editing ? (
                                    <div className="d-flex justify-content-center justify-content-lg-start align-items-center gap-2 mb-2">
                                        <input type="text" className="form-control form-control-sm bg-dark text-white border-0" value={newName} onChange={(event) => setNewName(event.target.value)} autoFocus />
                                        <button className="btn btn-sm btn-emerald text-white shadow-sm" onClick={handleSaveName}><i className="bi bi-check-lg"></i></button>
                                        <button className="btn btn-sm btn-outline-secondary text-white border-opacity-50" onClick={() => setEditing(false)}><i className="bi bi-x-lg"></i></button>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-wrap justify-content-center justify-content-lg-start align-items-center gap-2 mb-1">
                                        <h3 className="fw-bold mb-0 text-white">{auth.currentUser?.displayName || auth.currentUser?.email.split("@")[0]}</h3>
                                        {isPro(auth.currentUser) && <span className="badge rounded-pill fw-bold" style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", fontSize: "0.65rem" }}>PRO</span>}
                                        {isAdmin(auth.currentUser) && <span className="badge rounded-pill fw-bold bg-danger" style={{ fontSize: "0.65rem" }}>ADMIN</span>}
                                    </div>
                                )}
                                <p className="text-emerald opacity-75 small fw-bold tracking-wide mb-2">{auth.currentUser?.email}</p>
                                <div className="d-grid gap-2 d-sm-flex flex-wrap justify-content-center justify-content-lg-start">
                                    {photoURL && <button className="btn btn-link text-emerald small p-0 text-decoration-none opacity-75 hover-opacity-100" onClick={handleRepositionCurrent}><i className="bi bi-aspect-ratio me-1"></i>Acomodar foto</button>}
                                    <button className="btn btn-emerald py-2 rounded-3 fw-bold text-white shadow-emerald" onClick={() => setEditing(true)}><i className="bi bi-pencil-square me-1"></i>Editar nombre</button>
                                    <button className="btn btn-outline-secondary py-2 rounded-3 fw-bold text-white border-opacity-25" onClick={handleLogout}><i className="bi bi-box-arrow-right me-1"></i>Salir</button>
                                </div>
                            </div>
                        </div>

                        <div className="row text-center mt-4 g-2">
                            <div className="col-4"><div className="p-2 rounded-3" style={{ background: "rgba(255,255,255,0.03)" }}><h5 className="fw-bold text-emerald mb-0">{stats.inventory}</h5><small className="text-light-muted small">Coleccion</small></div></div>
                            <div className="col-4"><div className="p-2 rounded-3" style={{ background: "rgba(255,255,255,0.03)" }}><h5 className="fw-bold text-pink mb-0">{stats.wishlist}</h5><small className="text-light-muted small">Wishlist</small></div></div>
                            <div className="col-4"><div className="p-2 rounded-3" style={{ background: "rgba(255,255,255,0.03)" }}><h5 className="fw-bold text-danger mb-0">{stats.selling}</h5><small className="text-light-muted small">Ventas</small></div></div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-8">
                    <div className="p-3 p-md-4 rounded-4 h-100" style={{ background: "rgba(255,255,255,0.03)", boxShadow: "0 18px 45px rgba(0,0,0,0.14)" }}>
                        <div className="mb-4">
                            <h6 className="text-white fw-bold mb-1 small">Tu rol en Pocky's</h6>
                            <p className="text-light-muted extra-small mb-2">Cambia tu enfoque para personalizar tu experiencia y colores.</p>
                            <div className="d-flex gap-2 flex-wrap">
                                {[
                                    { id: "inventory", label: "Coleccionista", color: getThemeByRole("inventory").primary, icon: "bi-box-seam" },
                                    { id: "sell", label: "Vendedor", color: getThemeByRole("sell").primary, icon: "bi-tag" },
                                    { id: "buy", label: "Comprador", color: getThemeByRole("buy").primary, icon: "bi-bag-heart" }
                                ].map((role) => (
                                    <button key={role.id} className={`btn btn-sm rounded-pill fw-bold transition-all ${userRole === role.id ? "text-white shadow-emerald" : "text-white-50 border-0"}`} style={{ backgroundColor: userRole === role.id ? role.color : "rgba(255,255,255,0.05)", fontSize: "0.8rem", padding: "0.5rem 0.9rem" }} onClick={() => handleRoleChange(role.id)}>
                                        <i className={`bi ${role.icon} me-1`}></i>{role.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-4 p-3" style={{ background: "rgba(255,255,255,0.025)" }}>
                            <h6 className="text-white fw-bold mb-1 small">Estado de cuenta</h6>
                            <p className="text-light-muted extra-small mb-3">Resumen rapido de tu actividad actual.</p>
                            <div className="d-flex flex-wrap gap-2">
                                <span className="badge rounded-pill text-bg-dark" style={{ background: "rgba(255,255,255,0.06)" }}>Inventario: {stats.inventory}</span>
                                <span className="badge rounded-pill text-bg-dark" style={{ background: "rgba(255,255,255,0.06)" }}>Wishlist: {stats.wishlist}</span>
                                <span className="badge rounded-pill text-bg-dark" style={{ background: "rgba(255,255,255,0.06)" }}>Ventas: {stats.selling}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Admin Panel (solo visible para el admin master) ── */}
            {isAdmin(auth.currentUser) && (
                <div className="mt-4 p-3 p-md-4 rounded-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-shield-lock-fill text-danger"></i>
                        <h6 className="fw-bold text-white mb-0">Panel de Administración</h6>
                        <span className="badge bg-danger rounded-pill fw-bold ms-auto" style={{ fontSize: '0.6rem', letterSpacing: '0.5px' }}>SOLO ADMINS</span>
                    </div>
                    <p className="text-white-50 extra-small mb-3">Otorga acceso de administrador temporal a otros usuarios. Esto les dará acceso al Toolbox de pruebas, la sección de Tickets y funciones de mediación.</p>

                    <div className="d-flex gap-2 mb-3">
                        <input
                            type="email"
                            className="form-control bg-black bg-opacity-40 border-danger border-opacity-25 text-white"
                            placeholder="Email del usuario..."
                            value={adminSearchEmail}
                            onChange={e => setAdminSearchEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGrantAdmin()}
                            style={{ fontSize: '0.85rem' }}
                        />
                        <button
                            className="btn btn-outline-danger rounded-3 fw-bold px-3 flex-shrink-0"
                            onClick={handleGrantAdmin}
                            disabled={adminSearching}
                            style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                        >
                            {adminSearching ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-person-plus me-1"></i>Dar Admin</>}
                        </button>
                    </div>

                    {adminEmails.length > 0 && (
                        <div className="d-flex flex-column gap-1">
                            <small className="text-white-50 mb-1" style={{ fontSize: '0.7rem' }}>Admins activos (temporales):</small>
                            {adminEmails.map(email => (
                                <div key={email} className="d-flex align-items-center gap-2 bg-dark bg-opacity-40 rounded-3 px-3 py-2">
                                    <i className="bi bi-shield-check text-danger" style={{ fontSize: '0.8rem' }}></i>
                                    <span className="text-white small flex-grow-1" style={{ fontSize: '0.82rem' }}>{email}</span>
                                    <button
                                        className="btn btn-sm btn-outline-danger rounded-pill border-0 px-2 py-0"
                                        onClick={() => handleRevokeAdmin(email)}
                                        title="Revocar admin"
                                    >
                                        <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }}></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {adminEmails.length === 0 && (
                        <p className="text-white-50 extra-small text-center opacity-50 mb-0">No hay admins temporales activos.</p>
                    )}
                </div>
            )}
        </div>
    );
}
