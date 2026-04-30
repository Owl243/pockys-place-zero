import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { listenNotifications } from "../services/notificationService";

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
                            <div key={n.id} className="p-3 mb-2 rounded-3 bg-light bg-opacity-10 border-start border-emerald border-4">
                                <div className="d-flex gap-2">
                                    <i className="bi bi-info-circle text-emerald"></i>
                                    <div>
                                        <p className="mb-0 small fw-bold text-white">{n.type === 'match' ? '¡Match encontrado!' : 'Aviso'}</p>
                                        <p className="mb-0 small text-light opacity-75">{n.message}</p>
                                        <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : 'Hace un momento'}
                                        </small>
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
