import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { listenNotifications } from "../services/notificationService";
import { Link } from "react-router-dom";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsub = listenNotifications(user.uid, (data) => {
            setNotifications(data);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    return (
        <div className="container py-4">
            <div className="d-flex align-items-center gap-3 mb-5">
                <div className="bg-emerald bg-opacity-10 p-3 rounded-4 border border-emerald border-opacity-20 shadow-emerald">
                    <i className="bi bi-bell-fill text-emerald fs-4"></i>
                </div>
                <div>
                    <h2 className="fw-bold mb-0 text-white tracking-tight">Centro de <span className="text-emerald">Avisos</span></h2>
                    <p className="text-light-muted small mb-0">Entérate de lo que pasa en el mercado</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-grow text-emerald" role="status"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-5 bg-dark bg-opacity-20 rounded-5 border border-white border-opacity-5">
                    <i className="bi bi-bell-slash fs-1 text-muted mb-3 d-block"></i>
                    <p className="text-light-muted">No tienes notificaciones por ahora.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {notifications.map((n) => (
                        <div key={n.id} className="col-12 col-md-6 col-lg-4">
                            <div className="notification-card rounded-4 p-3 border border-white border-opacity-5 bg-dark bg-opacity-40 backdrop-blur-md shadow-xl transition-all hover-translate-y-n1">
                                <div className="d-flex gap-3 align-items-center">
                                    <div className="notification-img-wrapper rounded-3 overflow-hidden bg-black bg-opacity-30 border border-white border-opacity-10" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                        <img src={n.cardImage || "https://placehold.co/60x60/1a1a1a/10b981?text=Card"} className="w-100 h-100 object-fit-contain" alt="Notificación" />
                                    </div>
                                    <div className="flex-grow-1 min-w-0">
                                        <h6 className="text-emerald fw-bold mb-1 small">{n.title}</h6>
                                        <p className="text-white opacity-80 mb-1 small lh-sm">{n.message}</p>
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span className="text-light-muted" style={{ fontSize: '0.65rem' }}>{n.createdAt?.toDate().toLocaleDateString()}</span>
                                            <Link to={n.link || '/'} className="btn btn-emerald btn-sm py-1 px-3 rounded-pill fw-bold text-white shadow-emerald" style={{ fontSize: '0.6rem' }}>
                                                Ver ahora
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .notification-card {
                    border-left: 4px solid #10b981 !important;
                }
                .notification-card:hover {
                    background: rgba(16, 185, 129, 0.05);
                    border-color: #10b981;
                }
                .hover-translate-y-n1:hover { transform: translateY(-4px); }
            `}</style>
        </div>
    );
}