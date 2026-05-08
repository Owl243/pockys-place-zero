import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { sendFeedMessage } from "../services/feedService";
import { listenNotifications, markAsRead } from "../services/notificationService";
import { listenUserChats, listenMessages, sendMessage, isAdmin } from "../services/chatService";
import { useCurrency } from "../context/CurrencyContext";
import { getPriceRaw } from "../utils/cardUtils";
import { useNavigate, Link } from "react-router-dom";
import { startChat } from "../services/chatService";

export default function Activity() {
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState("muro"); // "muro" | "mensajes" | "alertas"
    
    // Social Feed States
    const [feedItems, setFeedItems] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(true);
    const [feedText, setFeedText] = useState("");

    // Notifications States
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(true);

    // Chat States
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatText, setChatText] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const chatEndRef = useRef(null);

    const user = auth.currentUser;

    // ── Social Feed Listener ──
    useEffect(() => {
        const q = query(collection(db, "feed"), orderBy("timestamp", "desc"), limit(50));
        const unsub = onSnapshot(q, (snap) => {
            setFeedItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadingFeed(false);
        });
        return () => unsub();
    }, []);

    // ── Notifications Listener ──
    useEffect(() => {
        if (!user) return;
        const unsub = listenNotifications(user.uid, (data) => {
            setNotifications(data);
            setLoadingNotifs(false);
        });
        return () => unsub();
    }, [user]);

    // ── Chats List Listener ──
    useEffect(() => {
        if (!user) return;
        const unsub = listenUserChats(user, (data) => {
            setChats(data);
            setLoadingChats(false);
        });
        return () => unsub();
    }, [user]);

    // ── Single Chat Listener ──
    useEffect(() => {
        if (!activeChat) return;
        const unsub = listenMessages(activeChat.id, (data) => {
            setChatMessages(data);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsub();
    }, [activeChat]);

    const handleSendFeed = async () => {
        if (!user || !feedText.trim()) return;
        await sendFeedMessage(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, feedText);
        setFeedText("");
    };

    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!user || !chatText.trim() || !activeChat) return;
        await sendMessage(activeChat.id, user.uid, chatText);
        setChatText("");
    };

    const handleInterest = async (item) => {
        if (!user || user.uid === item.userId) return;
        await startChat(user, { id: item.userId, name: item.userName, photo: item.userPhoto }, `¡Hola! Me interesa tu carta ${item.cardName}`);
        setActiveTab("mensajes");
    };

    const getOtherParticipant = (chat) => {
        const otherId = chat.participants.find(id => id !== user.uid);
        if (!otherId && chat.participants.length > 0) {
             const firstId = chat.participants[0];
             return { id: firstId, ...chat.participantData[firstId] };
        }
        return { id: otherId, ...chat.participantData[otherId] };
    };

    const unreadNotifs = notifications.filter(n => !n.read).length;
    const unreadChats = chats.filter(c => c.unread?.[user?.uid]).length;

    return (
        <div className="pb-5 container-xl">
            <div className="text-center pt-4 pb-3">
                <h2 className="fw-bold text-white mb-1">Comunidad</h2>
                <p className="text-white-50 small">Feed social, mensajes privados y alertas en un solo lugar</p>
            </div>

            {/* ── Tabs Selector ── */}
            <div className="d-flex justify-content-center mb-4 sticky-top pt-2" style={{ top: '70px', zIndex: 100 }}>
                <div className="d-flex gap-1 p-1 rounded-pill bg-dark bg-opacity-80 backdrop-blur-md border border-white border-opacity-10 shadow-lg">
                    {[
                        { key: "muro", label: "Muro", icon: "bi-rss", badge: 0 },
                        { key: "mensajes", label: "Mensajes", icon: "bi-chat-dots", badge: unreadChats },
                        { key: "alertas", label: "Alertas", icon: "bi-bell", badge: unreadNotifs }
                    ].map(tab => (
                        <button 
                            key={tab.key} 
                            className={`btn btn-sm rounded-pill px-3 px-md-4 py-2 fw-bold transition-all position-relative ${activeTab === tab.key ? 'btn-emerald text-white shadow-emerald' : 'text-white-50'}`} 
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                            {tab.badge > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark border border-dark border-1" style={{ fontSize: '0.6rem' }}>{tab.badge}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-fade-in mx-auto h-100">
                
                {/* ── TAB: MURO (FEED) ── */}
                {activeTab === 'muro' && (
                    <div className="mx-auto" style={{ maxWidth: '800px' }}>
                        <div className="bg-dark bg-opacity-30 rounded-5 border border-white border-opacity-5 p-3 mb-3 backdrop-blur-xl shadow-2xl" style={{ height: "calc(100dvh - 300px)", minHeight: "350px", overflowY: "auto", display: 'flex', flexDirection: 'column-reverse' }}>
                            {loadingFeed ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                                feedItems.map(item => {
                                    const isMe = item.userId === user?.uid;
                                    return (
                                        <div key={item.id} className={`mb-3 d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div className={`d-flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`} style={{ maxWidth: '90%' }}>
                                                <img src={item.userPhoto || `https://ui-avatars.com/api/?name=${item.userName}&background=random`} className="rounded-circle border border-white border-opacity-10 shadow-sm mt-1" style={{ width: "32px", height: "32px", objectFit: "cover" }} />
                                                <div className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                                                    <span className="fw-bold text-white-50 extra-small mb-1">{item.userName}</span>
                                                    {item.action === 'sale' ? (
                                                        <div className="bg-emerald bg-opacity-10 border border-emerald border-opacity-20 rounded-4 p-2 d-flex align-items-center gap-2 shadow-sm">
                                                            <img src={item.cardImage} style={{ height: "50px", width: "36px", objectFit: "contain" }} />
                                                            <div className="min-w-0">
                                                                <p className="mb-0 text-white fw-bold extra-small text-truncate">{item.cardName}</p>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="text-emerald fw-bold" style={{ fontSize: '0.7rem' }}>{formatPrice(getPriceRaw(item.cardPriceData))}</span>
                                                                    <button className="btn btn-emerald btn-sm rounded-pill py-0 px-2 fw-bold" onClick={() => handleInterest(item)} style={{ fontSize: '0.6rem' }}>Claim</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : item.action === 'wishlist_public' ? (
                                                        <div className="bg-dark bg-opacity-30 border border-pink border-opacity-40 rounded-4 p-2 d-flex align-items-center gap-2 shadow-sm">
                                                            <img src={item.cardImage} style={{ height: "50px", width: "36px", objectFit: "contain" }} />
                                                            <div className="min-w-0">
                                                                <p className="mb-0 text-white fw-bold extra-small text-truncate">{item.cardName}</p>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="text-pink fw-bold" style={{ fontSize: '0.6rem' }}>Buscando...</span>
                                                                    <button className="btn btn-pink btn-sm rounded-pill py-0 px-2 fw-bold text-white" onClick={() => handleInterest(item)} style={{ fontSize: '0.6rem' }}>Tengo esto</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`p-2 px-3 rounded-4 ${isMe ? 'bg-emerald bg-opacity-20 border-emerald border-opacity-30 shadow-emerald-sm' : 'bg-dark bg-opacity-60 border-white border-opacity-10'}`} style={{ wordBreak: 'break-word' }}>
                                                            <p className="mb-0 text-white small">{item.message}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="input-group rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-60 backdrop-blur-xl p-1 shadow-2xl">
                            <input type="text" className="form-control border-0 bg-transparent text-white ps-4 py-3" placeholder="Comparte con el grupo..." value={feedText} onChange={e => setFeedText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendFeed()} />
                            <button className="btn btn-emerald rounded-pill px-4 ms-2 transition-all" onClick={handleSendFeed}><i className="bi bi-send-fill"></i></button>
                        </div>
                    </div>
                )}

                {/* ── TAB: MENSAJES (CHATS) ── */}
                {activeTab === 'mensajes' && (
                    <div className="row g-3" style={{ height: "calc(100dvh - 250px)", minHeight: "400px" }}>
                        <div className={`col-12 col-lg-4 h-100 ${activeChat ? 'd-none d-lg-block' : 'd-block'}`}>
                            <div className="bg-dark bg-opacity-40 rounded-5 border border-white border-opacity-10 shadow-2xl h-100 d-flex flex-column backdrop-blur-xl overflow-hidden">
                                <div className="p-3 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold mb-0 text-white">Mensajes Privados</h6>
                                </div>
                                <div className="overflow-auto flex-grow-1 p-2">
                                    {loadingChats ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                                        chats.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-chat fs-1 d-block mb-2"></i>Vacío</div> : (
                                            chats.map(chat => {
                                                const other = getOtherParticipant(chat);
                                                const isActive = activeChat?.id === chat.id;
                                                return (
                                                    <div key={chat.id} onClick={() => setActiveChat(chat)} className={`d-flex align-items-center gap-2 p-3 rounded-4 mb-1 cursor-pointer transition-all ${isActive ? 'bg-emerald bg-opacity-20 border-emerald border-opacity-30' : 'hover-bg-white-05'}`}>
                                                        <img src={other.photo || `https://ui-avatars.com/api/?name=${other.name}&background=random`} className="rounded-circle border border-white border-opacity-10" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                        <div className="min-w-0 flex-grow-1">
                                                            <h6 className={`mb-0 fw-bold small text-truncate ${isActive ? 'text-emerald' : 'text-white'}`}>{other.name}</h6>
                                                            <p className="mb-0 text-white-50 extra-small text-truncate">{chat.lastMessage}</p>
                                                        </div>
                                                        {chat.unread?.[user.uid] && <div className="bg-emerald rounded-circle" style={{ width: '8px', height: '8px' }}></div>}
                                                    </div>
                                                );
                                            })
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`col-12 col-lg-8 h-100 ${activeChat ? 'd-block' : 'd-none d-lg-flex align-items-center justify-content-center bg-dark bg-opacity-10 rounded-5 border border-white border-opacity-5'}`}>
                            {activeChat ? (
                                <div className="bg-dark bg-opacity-30 rounded-5 border border-white border-opacity-10 shadow-2xl h-100 d-flex flex-column backdrop-blur-xl overflow-hidden">
                                    <div className="p-3 border-bottom border-white border-opacity-5 d-flex align-items-center gap-3 bg-dark bg-opacity-20">
                                        <button className="btn btn-link text-white d-lg-none p-0" onClick={() => setActiveChat(null)}><i className="bi bi-chevron-left fs-5"></i></button>
                                        <img src={getOtherParticipant(activeChat).photo || `https://ui-avatars.com/api/?name=${getOtherParticipant(activeChat).name}&background=random`} className="rounded-circle border border-white border-opacity-20" style={{ width: '36px', height: '36px', objectFit: 'cover' }} />
                                        <h6 className="fw-bold mb-0 text-white small">{getOtherParticipant(activeChat).name}</h6>
                                    </div>
                                    <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2">
                                        {chatMessages.map((msg, idx) => {
                                            const isMine = msg.senderId === user.uid;
                                            return (
                                                <div key={msg.id || idx} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                                    <div className={`p-2 px-3 rounded-4 max-w-75 shadow-sm ${isMine ? 'bg-emerald bg-opacity-20 border border-emerald border-opacity-20 rounded-tr-0 text-white' : 'bg-dark bg-opacity-50 border border-white border-opacity-10 rounded-tl-0 text-white'}`} style={{ maxWidth: '80%' }}>
                                                        <p className="mb-0 small">{msg.text}</p>
                                                        <small className="text-white-50 mt-1 d-block opacity-40" style={{ fontSize: '0.55rem' }}>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="p-3 bg-dark bg-opacity-40 border-top border-white border-opacity-5">
                                        <form onSubmit={handleSendChat} className="input-group rounded-pill overflow-hidden border border-white border-opacity-10 bg-black bg-opacity-40 p-1">
                                            <input type="text" className="form-control border-0 bg-transparent text-white px-3 py-2 small" placeholder="Escribe..." value={chatText} onChange={(e) => setChatText(e.target.value)} />
                                            <button type="submit" className="btn btn-emerald rounded-pill px-3 ms-1 transition-all"><i className="bi bi-send-fill"></i></button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center opacity-20">
                                    <i className="bi bi-chat-dots fs-1"></i>
                                    <p className="mt-2 fw-bold">Selecciona un mensaje</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB: ALERTAS (NOTIFICACIONES) ── */}
                {activeTab === 'alertas' && (
                    <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: '700px' }}>
                        {loadingNotifs ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                            notifications.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-bell-slash fs-1 d-block mb-2"></i>Sin alertas</div> : (
                                notifications.map(n => (
                                    <div key={n.id} className={`notification-card rounded-4 p-3 border border-white border-opacity-5 bg-dark bg-opacity-40 shadow-lg backdrop-blur-md transition-all ${n.read ? 'opacity-50' : 'hover-translate-y-n1'}`} style={{ borderLeft: n.read ? '4px solid transparent' : '4px solid #10b981' }}>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-black bg-opacity-30 rounded-3 p-1 flex-shrink-0" style={{ width: '52px', height: '52px' }}>
                                                <img src={n.cardImage || "https://ui-avatars.com/api/?name=N&background=10b981"} className="w-100 h-100 object-fit-contain" />
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <h6 className={`${n.read ? 'text-white-50' : 'text-emerald'} fw-bold mb-0 small text-truncate`}>{n.title}</h6>
                                                <p className="text-white-50 extra-small mb-1">{n.message}</p>
                                                <Link to={n.link || '/'} className="text-emerald text-decoration-none extra-small fw-bold hover-underline" onClick={() => markAsRead(user.uid, n.id)}>Ver ahora →</Link>
                                            </div>
                                            {!n.read && <div className="bg-warning rounded-circle shadow-emerald" style={{ width: '8px', height: '8px' }}></div>}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .extra-small { font-size: 0.65rem; }
                .notification-card { border-left: 4px solid #10b981 !important; }
                .btn-emerald { background: #10b981; color: white; border: none; }
                .btn-emerald:hover { background: #059669; transform: scale(1.02); }
                .shadow-emerald { box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
                .shadow-emerald-sm { box-shadow: 0 0 10px rgba(16, 185, 129, 0.1); }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .hover-bg-white-05:hover { background: rgba(255,255,255,0.05); }
                .rounded-tr-0 { border-top-right-radius: 4px !important; }
                .rounded-tl-0 { border-top-left-radius: 4px !important; }
                .cursor-pointer { cursor: pointer; }
                .hover-translate-y-n1:hover { transform: translateY(-3px); }
                .hover-underline:hover { text-decoration: underline !important; }
                .btn-pink { background: #ff4b91; border: none; color: white; }
                .btn-pink:hover { background: #e63e7d; transform: scale(1.02); }
                .text-pink { color: #ff4b91 !important; }
                .bg-pink { background-color: #ff4b91 !important; }
                .border-pink { border-color: rgba(255, 75, 145, 0.3) !important; }
            `}</style>
        </div>
    );
}
