import { useState } from 'react';
import { auth, db } from '../firebase';
import { createSaleOfferNotification } from '../services/notificationService';
import { isAdmin } from '../services/chatService';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';

export default function DevToolbox({ user }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isAdmin(user)) return null;

    const simulateOffer = async () => {
        setLoading(true);
        try {
            // Buscar una publicación activa del usuario actual
            const q = query(collection(db, "listings"), where("userId", "==", user.uid), where("status", "==", "active"), limit(1));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                alert("Primero pon una carta en venta para poder recibir una oferta de prueba.");
                return;
            }

            const listing = { id: snap.docs[0].id, ...snap.docs[0].data() };
            
            // Simular un usuario bot
            const botUser = {
                uid: "bot_tester_123",
                displayName: "Bot Coleccionista",
                email: "bot@tester.com",
                photoURL: "https://ui-avatars.com/api/?name=Bot&background=random"
            };

            await createSaleOfferNotification(user.uid, {
                item: {
                    id: listing.id,
                    cardName: listing.cardName || listing.name,
                    cardImage: listing.cardImage || listing.image,
                    userId: user.uid
                },
                offerAmount: Math.floor(Math.random() * 1000) + 100,
                offerCurrency: "MXN",
                offerUser: botUser
            });

            alert("Oferta simulada enviada a tu panel de alertas");
        } catch (e) {
            console.error(e);
            alert("Error simulando oferta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="position-fixed bottom-0 start-0 m-3" style={{ zIndex: 9999 }}>
            <button 
                className="btn btn-warning rounded-circle shadow-lg d-flex align-items-center justify-content-center" 
                style={{ width: '50px', height: '50px' }}
                onClick={() => setOpen(!open)}
            >
                <i className={`bi ${open ? 'bi-x-lg' : 'bi-tools'} fs-5`}></i>
            </button>

            {open && (
                <div className="bg-dark border border-warning border-opacity-50 rounded-4 p-3 mt-2 shadow-2xl animate-fade-in" style={{ width: '220px' }}>
                    <h6 className="text-warning fw-bold mb-3 small"><i className="bi bi-cpu me-2"></i>Dev Toolbox</h6>
                    <button 
                        className="btn btn-outline-warning btn-sm w-100 rounded-pill mb-2 fw-bold" 
                        onClick={simulateOffer}
                        disabled={loading}
                    >
                        {loading ? "Procesando..." : "Simular Oferta Recibida"}
                    </button>
                    <p className="extra-small text-white-50 mb-0 opacity-50 text-center">Solo visible para admins</p>
                </div>
            )}
        </div>
    );
}
