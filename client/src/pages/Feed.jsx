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
        <div className="container py-2 mb-4" style={{ maxWidth: '850px' }}>
            <div className="bg-dark bg-opacity-30 rounded-5 border border-white border-opacity-5 shadow-2xl p-1 backdrop-blur-xl">
                <div className="feed-container p-3 px-md-4" style={{ height: "calc(100vh - 210px)", minHeight: "450px", overflowY: "auto", display: 'flex', flexDirection: 'column-reverse' }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-grow text-emerald" role="status"></div>
                            <p className="text-light-muted mt-2 small tracking-wider">SINCRONIZANDO FEED...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-5 w-100 opacity-50">
                            <i className="bi bi-chat-dots fs-1 text-emerald mb-3 d-block"></i>
                            <p className="text-light-muted small">No hay conversaciones aún. ¡Inicia el chat!</p>
                        </div>
                    ) : (
                        items.map((item) => {
                            const isMe = item.userId === auth.currentUser?.uid;
                            return (
                                <div key={item.id} className={`mb-4 animate-fade-in d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                    <div className={`d-flex gap-2 max-w-85 ${isMe ? 'flex-row-reverse' : 'flex-row'}`} style={{ maxWidth: '85%' }}>
                                        <img 
                                            src={item.userPhoto || "https://via.placeholder.com/40"} 
                                            className="rounded-circle border border-white border-opacity-10 shadow-sm mt-1 flex-shrink-0"
                                            style={{ width: "36px", height: "36px", objectFit: "cover" }}
                                            alt={item.userName}
                                        />
                                        <div className={`d-flex flex-column ${isMe ? 'align-items-end text-end' : 'align-items-start text-start'}`}>
                                            <div className="d-flex align-items-center gap-2 mb-1 px-1">
                                                <span className="fw-bold text-white opacity-50" style={{ fontSize: '0.75rem' }}>{isMe ? 'Tú' : item.userName}</span>
                                                <span className="text-light-muted opacity-40" style={{ fontSize: '0.65rem' }}>
                                                    {item.timestamp ? item.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                                                </span>
                                            </div>
                                            
                                            {item.action === 'sale' ? (
                                                <div className="card-sale-premium rounded-4 overflow-hidden border border-emerald border-opacity-20 shadow-emerald-sm transition-all hover-scale-101">
                                                    <div className="d-flex align-items-center p-3 gap-3 bg-emerald bg-opacity-10 backdrop-blur-md">
                                                        <div className="card-img-wrapper rounded-3 p-1 bg-black bg-opacity-40 border border-white border-opacity-10 position-relative">
                                                            <img src={item.cardImage} style={{ height: "70px", width: "50px", objectFit: "contain" }} alt={item.cardName} />
                                                            <div className="position-absolute top-0 start-0 w-100 h-100 bg-emerald opacity-10 blur-xl"></div>
                                                        </div>
                                                        <div className="flex-grow-1 min-w-0">
                                                            <div className="d-flex justify-content-between align-items-start gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="mb-0 text-white fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>{item.cardName}</p>
                                                                    <p className="mb-0 text-emerald opacity-75 fw-medium" style={{ fontSize: '0.65rem' }}>#{item.cardNumber} • {item.cardSetName}</p>
                                                                </div>
                                                                {getPriceRaw(item.cardPriceData) && (
                                                                    <div className="price-tag-premium">
                                                                        {formatPrice(getPriceRaw(item.cardPriceData))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 d-flex align-items-center justify-content-between">
                                                                <span className="badge-sale-type">EN VENTA</span>
                                                                <i className="bi bi-arrow-right-short text-emerald opacity-50"></i>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : item.action === 'sale_finished' ? (
                                                <div className="card-sale-finished rounded-4 overflow-hidden border border-white border-opacity-5 transition-all opacity-75">
                                                    <div className="d-flex align-items-center p-3 gap-3 bg-dark bg-opacity-60 backdrop-blur-md">
                                                        <img src={item.cardImage} style={{ height: "60px", width: "45px", objectFit: "contain", filter: 'grayscale(1)' }} className="opacity-50" alt={item.cardName} />
                                                        <div className="flex-grow-1">
                                                            <p className="mb-0 text-white-50 text-decoration-line-through small fw-bold">{item.cardName}</p>
                                                            <p className="mb-0 text-light-muted opacity-50" style={{ fontSize: '0.6rem' }}>Venta finalizada</p>
                                                            <span className="badge text-secondary border border-secondary border-opacity-30 rounded-pill mt-1" style={{ fontSize: '0.55rem' }}>VENDIDO</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`message-bubble-modern ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                                                    <p className="mb-0 text-white opacity-90" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{item.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="chat-input-wrapper mx-auto mt-3">
                <div className="input-group shadow-emerald-lg rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-60 backdrop-blur-xl p-1">
                    <input 
                        type="text" 
                        className="form-control border-0 py-3 ps-4 bg-transparent text-white" 
                        placeholder="Comparte algo con el grupo..." 
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                        style={{ boxShadow: 'none' }}
                    />
                    <button className="btn btn-emerald-gradient rounded-pill px-4 ms-2 transition-all" onClick={handleSend}>
                        <i className="bi bi-send-fill"></i>
                    </button>
                </div>
            </div>

            <style>{`
                .feed-container::-webkit-scrollbar { width: 5px; }
                .feed-container::-webkit-scrollbar-track { background: transparent; }
                .feed-container::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 10px; }
                .feed-container::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }

                .message-bubble-modern {
                    padding: 0.75rem 1.1rem;
                    border-radius: 18px;
                    position: relative;
                    max-width: 100%;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    backdrop-filter: blur(10px);
                }
                .bubble-me {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-top-right-radius: 4px;
                }
                .bubble-other {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-top-left-radius: 4px;
                }

                .card-sale-premium {
                    background: rgba(16, 185, 129, 0.05);
                    width: 280px;
                    max-width: 100%;
                }
                .price-tag-premium {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #10b981;
                    background: rgba(0,0,0,0.4);
                    padding: 0.3rem 0.6rem;
                    border-radius: 8px;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    white-space: nowrap;
                    text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
                }
                .badge-sale-type {
                    font-size: 0.55rem;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: #10b981;
                    opacity: 0.8;
                }
                .btn-emerald-gradient {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }
                .btn-emerald-gradient:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                }
                .hover-scale-101:hover { transform: scale(1.01); }
                .shadow-emerald-sm { box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); }
                .shadow-emerald-lg { box-shadow: 0 0 30px rgba(0,0,0,0.3), 0 0 15px rgba(16, 185, 129, 0.1); }
                
                .animate-fade-in { animation: fadeInChat 0.3s ease-out forwards; }
                @keyframes fadeInChat {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}