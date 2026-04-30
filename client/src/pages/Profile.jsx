import { auth } from "../firebase";
import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { getInventory } from "../services/inventoryService";
import { uploadProfileImage, updateDisplayName } from "../services/profileService";
import { useToast } from "../context/ToastContext";
import { updateUserInFeed } from "../services/feedService";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import { useCurrency } from "../context/CurrencyContext";

export default function Profile() {
    const navigate = useNavigate();
    const showToast = useToast();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState(auth.currentUser?.displayName || "");
    const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL);
    const [stats, setStats] = useState({
        inventory: 0,
        wishlist: 0,
        selling: 0,
    });

    // Cropping states
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) return;
            setPhotoURL(user.photoURL);
            setNewName(user.displayName || "");
            const data = await getInventory(user.uid);
            setStats({
                inventory: data.filter(c => c.inInventory).length,
                wishlist: data.filter(c => c.inWishlist).length,
                selling: data.filter(c => c.forSale).length,
            });
        };
        load();
    }, []);

    const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveName = async () => {
        try {
            const user = auth.currentUser;
            await updateDisplayName(user, newName);
            await updateUserInFeed(user.uid, { userName: newName });
            setEditing(false);
            showToast("Nombre actualizado en todo el sitio", "success");
        } catch (err) {
            showToast("Error al actualizar nombre", "error");
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
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
        } catch (err) {
            console.error(err);
            showToast("Error al procesar imagen", "error");
        } finally {
            setUploading(false);
            setImage(null);
        }
    };

    useEffect(() => {
        if (showCropper) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [showCropper]);

    const handleLogout = async () => {
        await logout();
        navigate("/auth");
    };

    const { currency, toggleCurrency } = useCurrency();

    return (
        <div className="container py-4">
            {/* ... (Cropper Overlay) */}
            
            {/* ✂️ Cropper Overlay */}
            {showCropper && (
                <div className="position-fixed top-0 start-0 w-100 vh-100 bg-dark d-flex flex-column animate-fade-in" style={{ zIndex: 9999 }}>
                    <div className="p-3 d-flex justify-content-between align-items-center border-bottom border-white border-opacity-10 bg-dark">
                        <h6 className="text-white fw-bold mb-0">Acomodar Imagen</h6>
                        <button className="btn btn-sm btn-outline-light rounded-circle border-0" onClick={() => setShowCropper(false)}><i className="bi bi-x-lg"></i></button>
                    </div>
                    
                    <div className="flex-grow-1 position-relative bg-black">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>
                    
                    <div className="p-3 bg-dark border-top border-white border-opacity-10 shadow-lg">
                        <div className="d-flex align-items-center gap-2 mb-3 mx-auto" style={{ maxWidth: '300px' }}>
                            <i className="bi bi-zoom-out text-white-50 small"></i>
                            <input 
                                type="range" 
                                className="form-range flex-grow-1" 
                                min={1} max={3} step={0.1} 
                                value={zoom} 
                                onChange={(e) => setZoom(e.target.value)} 
                            />
                            <i className="bi bi-zoom-in text-white-50 small"></i>
                        </div>
                        <div className="d-flex gap-2 justify-content-center">
                            <button className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-pill text-white border-opacity-25" onClick={() => setShowCropper(false)}>Cancelar</button>
                            <button className="btn btn-emerald btn-sm px-4 py-2 rounded-pill text-white fw-bold shadow-emerald" onClick={handleCropSave}>
                                {uploading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle-fill me-2"></i>}
                                Aplicar y Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center mb-5">
                <div 
                    className="avatar-container mb-2 mx-auto shadow-2xl" 
                    onClick={() => !uploading && fileInputRef.current.click()}
                    style={{ width: '120px', height: '120px', cursor: 'pointer', position: 'relative' }}
                >
                    <img
                        src={photoURL || "https://via.placeholder.com/120"}
                        className={`rounded-circle border border-white border-opacity-10 w-100 h-100 object-fit-cover ${uploading ? 'opacity-25' : ''}`}
                        alt="Avatar"
                    />
                    {!uploading && (
                        <div className="position-absolute top-50 start-50 translate-middle opacity-0 hover-opacity-100 transition-all bg-black bg-opacity-40 rounded-circle p-4 w-100 h-100 d-flex align-items-center justify-content-center">
                            <i className="bi bi-camera-fill fs-2 text-white"></i>
                        </div>
                    )}
                    {uploading && (
                        <div className="spinner-border text-emerald position-absolute top-50 start-50 translate-middle" role="status"></div>
                    )}
                </div>

                {photoURL && (
                    <button 
                        className="btn btn-link text-emerald small p-0 mb-3 text-decoration-none opacity-75 hover-opacity-100"
                        onClick={handleRepositionCurrent}
                    >
                        <i className="bi bi-aspect-ratio me-1"></i> Acomodar foto actual
                    </button>
                )}

                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

                {editing ? (
                    <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                        <input 
                            type="text" 
                            className="form-control form-control-sm bg-dark text-white border-emerald w-auto text-center fw-bold"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                        />
                        <button className="btn btn-sm btn-emerald text-white shadow-sm" onClick={handleSaveName}><i className="bi bi-check-lg"></i></button>
                        <button className="btn btn-sm btn-outline-secondary text-white border-opacity-50" onClick={() => setEditing(false)}><i className="bi bi-x-lg"></i></button>
                    </div>
                ) : (
                    <h3 className="fw-bold mb-1 text-white">{auth.currentUser?.displayName || auth.currentUser?.email.split("@")[0]}</h3>
                )}
                
                <p className="text-emerald opacity-75 small fw-bold tracking-wide">{auth.currentUser?.email}</p>
            </div>

            <div className="bg-dark bg-opacity-40 p-4 rounded-4 border border-white border-opacity-5 mb-4 shadow-xl">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="text-white fw-bold mb-0">Precios y Moneda</h6>
                        <p className="text-light-muted small mb-0">Elige cómo ver los precios de mercado</p>
                    </div>
                    <div className="btn-group rounded-pill overflow-hidden border border-white border-opacity-10 p-1 bg-black bg-opacity-20 shadow-inner" style={{ minWidth: '160px' }}>
                        <button 
                            className={`btn btn-sm px-4 rounded-pill border-0 fw-bold transition-all duration-300 ${currency === 'USD' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`}
                            onClick={() => currency !== 'USD' && toggleCurrency()}
                        >
                            USD
                        </button>
                        <button 
                            className={`btn btn-sm px-4 rounded-pill border-0 fw-bold transition-all duration-300 ${currency === 'MXN' ? 'btn-emerald text-white shadow-emerald' : 'text-white-50 opacity-50'}`}
                            onClick={() => currency !== 'MXN' && toggleCurrency()}
                        >
                            MXN
                        </button>
                    </div>
                </div>
            </div>

            <div className="row text-center mb-5 g-4">
                <div className="col-4">
                    <div className="p-3 bg-dark bg-opacity-40 rounded-4 border border-white border-opacity-5">
                        <h4 className="fw-bold text-emerald mb-0">{stats.inventory}</h4>
                        <small className="text-light-muted">Colección</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="p-3 bg-dark bg-opacity-40 rounded-4 border border-white border-opacity-5">
                        <h4 className="fw-bold text-pink mb-0">{stats.wishlist}</h4>
                        <small className="text-light-muted">Wishlist</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="p-3 bg-dark bg-opacity-40 rounded-4 border border-white border-opacity-5">
                        <h4 className="fw-bold text-danger mb-0">{stats.selling}</h4>
                        <small className="text-light-muted">Ventas</small>
                    </div>
                </div>
            </div>

            <div className="d-grid gap-3 mx-auto" style={{ maxWidth: '400px' }}>
                <button className="btn btn-emerald py-3 rounded-4 fw-bold text-white shadow-emerald" onClick={() => setEditing(true)}>
                    <i className="bi bi-pencil-square me-2"></i> Editar Nombre
                </button>
                <button className="btn btn-outline-secondary py-3 rounded-4 fw-bold text-white border-opacity-25" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                </button>
            </div>
        </div>
    );
}