import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { listenNotifications, markAsRead } from "../services/notificationService";
import { Link } from "react-router-dom";

export default function NotificationPanel({ isOpen, onClose }) {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user || !isOpen) return;

        const unsubscribe = listenNotifications(user.uid, (data) => {
            setNotifications(data);
        });

        return () => unsubscribe();
    }, [isOpen]);

    const handleAction = async (n) => {
        if (!n.read && auth.currentUser) {
            await markAsRead(auth.currentUser.uid, n.id);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100" 
            style={{ zIndex: 2000, background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <div 
                className="position-absolute bg-dark shadow-lg rounded-4 p-3 overflow-hidden"
                style={{ 
                    top: "70px", 
                    right: "10px", 
                    width: "320px", 
                    maxHeight: "80vh",
                    border: "1px solid var(--border)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 fw-bold">Notificaciones</h5>
                    <button className="btn btn-sm btn-link text-muted" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="overflow-auto" style={{ maxHeight: "calc(80vh - 80px)" }}>
                    {notifications.length === 0 ? (
                        <div className="text-center py-5 opacity-50">
                            <i className="bi bi-bell-slash fs-1 mb-2 d-block"></i>
                            <p>No tienes notificaciones</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`p-3 mb-2 rounded-4 bg-dark bg-opacity-75 border-start border-4 d-flex gap-3 position-relative shadow-sm transition-all hover-scale-105 ${n.read ? 'border-secondary opacity-50' : 'border-emerald'}`}>
                                {n.cardImage && (
                                    <img src={n.cardImage} alt="Carta" className={`rounded shadow-sm border border-white border-opacity-10 ${n.read ? 'grayscale' : ''}`} style={{ width: '50px', height: '70px', objectFit: 'cover', filter: n.read ? 'grayscale(80%)' : 'none' }} />
                                )}
                                <div className="flex-grow-1 d-flex flex-column justify-content-between">
                                    <div>
                                        <p className={`mb-1 fw-bold ${n.read ? 'text-secondary' : 'text-emerald'}`} style={{ fontSize: '0.9rem' }}>
                                            {n.type === 'wishlist_match' ? '¡Deseo encontrado!' : 'Aviso'}
                                        </p>
                                        <p className="mb-2 text-white lh-sm fw-medium" style={{ fontSize: '0.8rem' }}>
                                            {n.message}
                                        </p>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                        <small className="text-white text-opacity-50" style={{ fontSize: '0.7rem' }}>
                                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : 'Reciente'}
                                        </small>
                                        {n.link && (
                                            <Link 
                                                to={n.link} 
                                                className="btn btn-dark btn-sm rounded-pill px-3 py-1 fw-bold text-white border border-white border-opacity-10" 
                                                style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                onClick={() => handleAction(n)}
                                            >
                                                Ver ahora
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
