import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { sendFeedMessage } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";
import { getDisplayPriceMxn } from "../utils/cardUtils";
import { useNavigate } from "react-router-dom";
import { startChat } from "../services/chatService";

export default function Feed() {
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");



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

    const handleInterest = async (item) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        if (currentUser.uid === item.userId) return;

        const targetUser = {
            id: item.userId,
            name: item.userName,
            photo: item.userPhoto
        };

        const initialMsg = `¡Hola! Me interesa tu carta ${item.cardName} (${item.cardSetName})`;
        await startChat(currentUser, targetUser, initialMsg);
        navigate("/chats");
    };

    return (
        <div className="container py-2 mb-4" style={{ maxWidth: '850px' }}>
            <div className="bg-dark bg-opacity-30 rounded-5 border border-white border-opacity-5 shadow-2xl p-1 backdrop-blur-xl">
                <div className="feed-container p-3 px-md-4" style={{ height: "calc(100dvh - 210px)", minHeight: "450px", overflowY: "auto", display: 'flex', flexDirection: 'column-reverse' }}>
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
                                            src={(item.userPhoto && !item.userPhoto.includes('via.placeholder.com')) 
                                                ? item.userPhoto 
                                                : `https://ui-avatars.com/api/?name=${item.userName || 'User'}&background=random`} 
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
                                                            <div className="min-w-0 mb-2">
                                                                <p className="mb-0 text-white fw-bold text-truncate" style={{ fontSize: '0.85rem' }}>{item.cardName}</p>
                                                                <p className="mb-0 text-emerald opacity-75 fw-medium text-truncate" style={{ fontSize: '0.65rem' }}>#{item.cardNumber} • {item.cardSetName}</p>
                                                            </div>
                                                            <div className="d-flex flex-column gap-2">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {getDisplayPriceMxn(item) && (
                                                                        <div className="price-tag-premium">
                                                                            {formatPrice(getDisplayPriceMxn(item))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {(item.deliveryPrefs || []).filter(p => p !== "Frikiplaza" && p !== "Metro (CDMX)").length > 0 && (
                                                                    <div className="d-flex flex-wrap gap-1 opacity-40">
                                                                        {(item.deliveryPrefs || []).filter(p => p !== "Frikiplaza" && p !== "Metro (CDMX)").map(pref => (
                                                                            <span key={pref} style={{ fontSize: "0.45rem", fontWeight: 800, color: '#10b981' }}>{pref === "Blanquita/Frikiplaza" ? "BLANQUITA" : pref.toUpperCase()}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                                <button 
                                                                    className="btn btn-claim-premium btn-sm rounded-pill px-3 fw-bold shadow-sm transition-all hover-scale-105"
                                                                    onClick={() => handleInterest(item)}
                                                                >
                                                                    Claim
                                                                </button>
                                                                <div className="ms-auto d-flex align-items-center opacity-50">
                                                                    <span className="badge-sale-type" style={{ fontSize: '0.5rem' }}>EN VENTA</span>
                                                                </div>
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
                @media (max-width: 576px) {
                    .card-sale-premium {
                        width: 100%;
                        max-width: 240px;
                    }
                    .card-sale-premium > div {
                        padding: 0.6rem !important;
                        gap: 0.6rem !important;
                    }
                    .price-tag-premium {
                        font-size: 0.65rem !important;
                        padding: 0.15rem 0.3rem !important;
                    }
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
                    flex-shrink: 0;
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
                .btn-claim-premium {
                    background: linear-gradient(135deg, #fbbf24 0%, #10b981 100%);
                    color: #000;
                    border: none;
                    font-size: 0.7rem;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
                }
                .btn-claim-premium:hover {
                    background: linear-gradient(135deg, #f59e0b 0%, #059669 100%);
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
                    color: #000;
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
