import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { sendFeedMessage } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";

export default function Feed() {
    const { formatPrice } = useCurrency();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");

    const getPriceRaw = (tcgData) => {
        if (!tcgData?.prices) return null;
        const types = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil'];
        for (const type of types) {
            if (tcgData.prices[type]?.market) return tcgData.prices[type].market;
        }
        return null;
    };

    useEffect(() => {
        const q = query(
            collection(db, "feed"), 
            orderBy("timestamp", "desc"), 
            limit(50)
        );

        const unsub = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setItems(data);
                setLoading(false);
            },
            (error) => {
                console.error("Feed subscription error:", error);
                setLoading(false);
            }
        );
        return () => unsub();
    }, []);

    const handleSend = async () => {
        const user = auth.currentUser;
        if (!user || !text.trim()) return;

        await sendFeedMessage(
            user.uid, 
            user.displayName || user.email.split("@")[0], 
            user.photoURL, 
            text
        );
        setText("");
    };

    return (
        <div className="container py-3 mb-5" style={{ maxWidth: '800px' }}>
            <div className="mb-4 text-start">
                <h2 className="fw-bold mb-1 text-white tracking-tight">Community <span className="text-emerald">Feed</span></h2>
                <p className="text-light-muted small mb-0">Conversa y descubre qué están vendiendo otros coleccionistas</p>
            </div>

            <div className="bg-dark bg-opacity-40 rounded-5 border border-white border-opacity-5 shadow-2xl p-2 backdrop-blur-md">
                <div className="feed-container p-3" style={{ height: "700px", overflowY: "auto", display: 'flex', flexDirection: 'column-reverse' }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-emerald" role="status"></div>
                            <p className="text-light-muted mt-2 small">Cargando actividad...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-5 w-100">
                            <i className="bi bi-rss fs-1 text-muted opacity-25 mb-3 d-block"></i>
                            <p className="text-light-muted">No hay actividad reciente. ¡Sé el primero en publicar algo!</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="mb-4 animate-fade-in w-100">
                                <div className="d-flex gap-3 align-items-start text-start">
                                    <img 
                                        src={item.userPhoto || "https://via.placeholder.com/40"} 
                                        className="rounded-circle border border-white border-opacity-10 shadow-sm"
                                        style={{ width: "42px", height: "42px", objectFit: "cover" }}
                                        alt={item.userName}
                                    />
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-baseline gap-2 mb-1">
                                            <span className="fw-bold text-white opacity-90">{item.userName}</span>
                                            <span className="text-light-muted" style={{ fontSize: '0.7rem' }}>
                                                {item.timestamp ? item.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recién ahora'}
                                            </span>
                                        </div>
                                        
                                        {item.action === 'sale' ? (
                                            <div className="bg-emerald bg-opacity-10 rounded-4 p-3 border border-emerald border-opacity-20 d-flex align-items-center gap-3">
                                                <div className="bg-dark rounded-3 p-1 border border-white border-opacity-5">
                                                    <img src={item.cardImage} style={{ height: "60px", objectFit: "contain" }} alt={item.cardName} />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <p className="mb-0 text-white-80 small">ha puesto en venta a <span className="text-emerald fw-bold">{item.cardName}</span></p>
                                                            <p className="mb-0 text-light-muted" style={{ fontSize: '0.6rem' }}>
                                                                #{item.cardNumber} / {item.cardRarity || 'Common'} — {item.cardSetName}
                                                            </p>
                                                        </div>
                                                        {getPriceRaw(item.cardPriceData) && (
                                                            <div className="text-emerald fw-bold small bg-dark bg-opacity-50 px-2 py-1 rounded-3 border border-emerald border-opacity-20 shadow-sm">
                                                                {formatPrice(getPriceRaw(item.cardPriceData))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="badge text-emerald border border-emerald border-opacity-30 rounded-pill mt-2" style={{ fontSize: '0.55rem' }}>VENTA</span>
                                                </div>
                                            </div>
                                        ) : item.action === 'sale_finished' ? (
                                            <div className="bg-info bg-opacity-10 rounded-4 p-3 border border-info border-opacity-20 d-flex align-items-center gap-3">
                                                <div className="bg-dark rounded-3 p-1 border border-white border-opacity-5">
                                                    <img src={item.cardImage} style={{ height: "60px", objectFit: "contain", filter: 'grayscale(1)' }} alt={item.cardName} />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <p className="mb-0 text-white-80 small">ha finalizado la venta de <span className="text-info fw-bold">{item.cardName}</span></p>
                                                            <p className="mb-0 text-light-muted" style={{ fontSize: '0.6rem' }}>
                                                                #{item.cardNumber} / {item.cardRarity || 'Common'} — {item.cardSetName}
                                                            </p>
                                                        </div>
                                                        {getPriceRaw(item.cardPriceData) && (
                                                            <div className="text-info fw-bold small opacity-75">
                                                                <s>{formatPrice(getPriceRaw(item.cardPriceData))}</s>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="badge text-info border border-info border-opacity-30 rounded-pill mt-2" style={{ fontSize: '0.55rem' }}>FINALIZADA</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-dark bg-opacity-40 rounded-4 p-3 border border-white border-opacity-5">
                                                <p className="mb-0 text-white-80 small">{item.message}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="position-relative mx-auto mt-4">
                <div className="input-group shadow-2xl rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-40 backdrop-blur-xl">
                    <input 
                        type="text" 
                        className="form-control border-0 py-3 ps-4 bg-transparent text-white" 
                        placeholder="Escribe algo a la comunidad..." 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                    />
                    <button className="btn btn-emerald px-4 fw-bold" onClick={handleSend}>
                        <i className="bi bi-send-fill"></i>
                    </button>
                </div>
            </div>

            <style>{`
                .feed-container::-webkit-scrollbar { width: 6px; }
                .feed-container::-webkit-scrollbar-track { background: transparent; }
                .feed-container::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
                .feed-container::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
                .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>



        </div>
    );
}