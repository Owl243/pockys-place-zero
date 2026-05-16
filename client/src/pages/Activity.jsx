import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { sendFeedMessage } from "../services/feedService";
import {
    listenNotifications,
    markAsRead,
    createSaleOfferNotification,
    updateNotificationStatus,
    createOfferAcceptedNotification,
    createCounterOfferNotification
} from "../services/notificationService";
import { listenUserChats, listenMessages, sendMessage, startChat, isAdmin } from "../services/chatService";
import { useCurrency } from "../context/CurrencyContext";
import { useToast } from "../context/ToastContext";
import { getDisplayPriceMxn, getPriceRaw } from "../utils/cardUtils";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { createTransactionTicket, listenAllTransactions, updateTransactionStatus } from "../services/transactionService";

function OfferModal({
    isOpen,
    title,
    amount,
    currency,
    loading,
    onAmountChange,
    onClose,
    onSubmit
}) {
    if (!isOpen) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 3000 }}
            onClick={onClose}
        >
            <div
                className="bg-dark rounded-5 border border-white border-opacity-10 shadow-2xl p-4 w-100"
                style={{ maxWidth: "360px" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h5 className="fw-bold text-white mb-3">{title}</h5>
                <div className="d-flex gap-2 mb-3">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white"
                        placeholder="Oferta"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                    />
                        <input
                            className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white"
                            value="MXN"
                            disabled
                            style={{ maxWidth: "110px" }}
                        />
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-light rounded-pill flex-grow-1" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button className="btn btn-emerald rounded-pill flex-grow-1 fw-bold" onClick={onSubmit} disabled={loading || !amount}>
                        {loading ? "Enviando..." : "Enviar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Activity() {
    const { formatPrice } = useCurrency();
    const showToast = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState("muro"); // "muro" | "mensajes" | "alertas" | "tickets"

    useEffect(() => {
        if (location.state?.openOffer) {
            openOfferModal(location.state.openOffer);
            navigate(".", { replace: true, state: {} });
        }
    }, [location.state, navigate]);

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
    const [offerModal, setOfferModal] = useState({ open: false, mode: "offer", item: null, notification: null });
    const [offerAmount, setOfferAmount] = useState("");
    const [offerCurrency, setOfferCurrency] = useState("MXN");
    const [submittingOffer, setSubmittingOffer] = useState(false);
    const chatEndRef = useRef(null);
    const feedEndRef = useRef(null);

    // Transactions (Admin Only)
    const [transactions, setTransactions] = useState([]);

    // Listing statuses map (listingId -> status) for real-time En Tratos detection in feed
    const [listingStatuses, setListingStatuses] = useState({});

    const user = auth.currentUser;
    const isUserAdmin = isAdmin(user);

    // ── Social Feed Listener ──
    useEffect(() => {
        const q = query(collection(db, "feed"), orderBy("timestamp", "desc"), limit(50));
        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(item => item.action !== "admin_ticket") // Ocultar tickets del muro público
                .reverse();
            setFeedItems(items);
            setLoadingFeed(false);
        });
        return () => unsub();
    }, []);

    // ── Listing Statuses Listener (for En Tratos in feed) ──
    useEffect(() => {
        const q = query(collection(db, "listings"), where("status", "in", ["active", "pending_admin"]));
        const unsub = onSnapshot(q, (snap) => {
            const map = {};
            snap.docs.forEach(d => { map[d.id] = d.data().status; });
            setListingStatuses(map);
        }, () => {});
        return () => unsub();
    }, []);

    useEffect(() => {
        if (activeTab === 'muro') {
            setTimeout(() => feedEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
    }, [feedItems, activeTab]);

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

    // ── Transactions Listener (Admin Only) ──
    useEffect(() => {
        if (!isUserAdmin) return;
        const unsub = listenAllTransactions((data) => {
            setTransactions(data);
        });
        return () => unsub();
    }, [isUserAdmin]);

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

    const openOfferModal = (item) => {
        const suggestedPrice = getDisplayPriceMxn(item) ?? getPriceRaw(item.cardPriceData);
        setOfferModal({ open: true, mode: "offer", item, notification: null });
        setOfferAmount(suggestedPrice ? String(suggestedPrice) : "");
        setOfferCurrency("MXN");
    };

    const openCounterOfferModal = (notification) => {
        setOfferModal({ open: true, mode: "counter", item: null, notification });
        setOfferAmount(notification.offerAmount ? String(notification.offerAmount) : "");
        setOfferCurrency(notification.offerCurrency || "MXN");
    };

    const closeOfferModal = () => {
        if (submittingOffer) return;
        setOfferModal({ open: false, mode: "offer", item: null, notification: null });
        setOfferAmount("");
        setOfferCurrency("MXN");
    };

    const handleClaimClick = (item) => {
        if (!user || user.uid === item.userId) return;
        openOfferModal(item);
    };

    const handleWishlistInterest = async (item) => {
        if (!user || user.uid === item.userId) return;
        openOfferModal(item);
    };

    const submitOffer = async () => {
        const parsedAmount = Number(offerAmount);
        if (!user || !offerModal.item || !parsedAmount || parsedAmount <= 0) return;
        setSubmittingOffer(true);
        try {
            await createSaleOfferNotification(offerModal.item.userId, {
                item: offerModal.item,
                offerAmount: parsedAmount,
                offerCurrency,
                offerUser: user
            });
            closeOfferModal();
            showToast("Oferta enviada", "success");
        } catch (error) {
            showToast("No se pudo enviar la oferta", "error");
        } finally {
            setSubmittingOffer(false);
        }
    };

    const handleAcceptOffer = async (notification) => {
        if (!user) return;
        try {
            await updateNotificationStatus(user.uid, notification.id, {
                status: "accepted",
                read: true
            });
            
            // Solo notificar si no es un bot de prueba
            if (notification.offerFromId !== "bot_tester_123") {
                await createOfferAcceptedNotification(notification.offerFromId, {
                    itemTitle: notification.listingTitle,
                    amount: notification.offerAmount,
                    currency: notification.offerCurrency,
                    sellerUser: user,
                    cardImage: notification.cardImage
                });
            }

            await createTransactionTicket({
                buyerId: notification.offerFromId,
                sellerId: user.uid,
                buyerName: notification.offerFromName,
                sellerName: user.displayName || user.email.split("@")[0],
                listingId: notification.listingId,
                listingTitle: notification.listingTitle,
                amount: notification.offerAmount,
                currency: notification.offerCurrency,
                cardImage: notification.cardImage,
                status: "accepted",
                participants: [user.uid, notification.offerFromId]
            });

            showToast("Oferta aceptada. Un administrador contactará a ambos pronto.", "success");
        } catch (error) {
            console.error("Error al aceptar oferta:", error);
            showToast("No se pudo aceptar la oferta", "error");
        }
    };

    const submitCounterOffer = async () => {
        const parsedAmount = Number(offerAmount);
        const notification = offerModal.notification;
        if (!user || !notification || !parsedAmount || parsedAmount <= 0) return;
        setSubmittingOffer(true);
        try {
            await updateNotificationStatus(user.uid, notification.id, {
                status: "countered",
                read: true,
                counterAmount: parsedAmount,
                counterCurrency: offerCurrency
            });
            
            // Solo notificar si no es un bot de prueba
            if (notification.offerFromId !== "bot_tester_123") {
                await createCounterOfferNotification(notification.offerFromId, {
                    itemTitle: notification.listingTitle,
                    amount: parsedAmount,
                    currency: offerCurrency,
                    sellerUser: user,
                    cardImage: notification.cardImage
                });
            }

            await createTransactionTicket({
                buyerId: notification.offerFromId,
                sellerId: user.uid,
                buyerName: notification.offerFromName,
                sellerName: user.displayName || user.email.split("@")[0],
                listingId: notification.listingId,
                listingTitle: notification.listingTitle,
                amount: parsedAmount,
                currency: offerCurrency,
                cardImage: notification.cardImage,
                status: "countered",
                participants: [user.uid, notification.offerFromId]
            });

            closeOfferModal();
            showToast("Contraoferta enviada. Un administrador contactará a ambos.", "success");
        } catch (error) {
            showToast("No se pudo enviar la contraoferta", "error");
        } finally {
            setSubmittingOffer(false);
        }
    };

    const handleAdminStartChat = async (targetUser, message) => {
        if (!user) return;
        try {
            const chatId = await startChat(user, targetUser, message);
            if (chatId) {
                setActiveTab("mensajes");
                // Buscamos el chat en la lista para activarlo
                const chatObj = chats.find(c => c.id === chatId);
                if (chatObj) setActiveChat(chatObj);
            }
        } catch (error) {
            showToast("Error al iniciar chat administrativo", "error");
        }
    };

    const handleUpdateTicket = async (ticket, status) => {
        try {
            await updateTransactionStatus(ticket.id, status, ticket.listingId);
            showToast(status === "completed" ? "Venta concretada" : "Venta cancelada", "success");
        } catch (error) {
            showToast("Error al actualizar ticket", "error");
        }
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
        <div
            className="pb-2 pb-md-4 container-xl px-2 d-flex flex-column overflow-hidden"
            style={{ height: "calc(100dvh - 86px - env(safe-area-inset-bottom))" }}
        >
            {/* ── Tabs Selector ── */}
            <div className="activity-tabs d-flex justify-content-center mb-2 mb-md-3 sticky-top pt-2 flex-shrink-0" style={{ zIndex: 100 }}>
                <div className="d-flex gap-1 p-1 rounded-pill bg-dark bg-opacity-80 backdrop-blur-md border border-white border-opacity-10 shadow-lg flex-wrap justify-content-center">
                    {[
                        { key: "muro", label: "Muro", icon: "bi-rss", badge: 0 },
                        { key: "mensajes", label: "Mensajes", icon: "bi-chat-dots", badge: unreadChats },
                        { key: "alertas", label: "Alertas", icon: "bi-bell", badge: unreadNotifs },
                        ...(isUserAdmin ? [{ key: "tickets", label: "Tickets", icon: "bi-ticket-detailed", badge: transactions.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length }] : [])
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`btn btn-sm rounded-pill px-2 px-sm-3 py-1 fw-bold transition-all position-relative ${activeTab === tab.key ? 'btn-emerald text-white shadow-emerald' : 'text-white-50'}`}
                            onClick={() => setActiveTab(tab.key)}
                            style={{ fontSize: '0.85rem' }}
                        >
                            <i className={`bi ${tab.icon} me-1`}></i>
                            <span>{tab.label}</span>
                            {tab.badge > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark border border-dark border-1" style={{ fontSize: '0.6rem' }}>{tab.badge}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-fade-in mx-auto h-100 d-flex flex-column flex-grow-1 w-100" style={{ minHeight: 0 }}>

                {/* ── TAB: MURO (FEED) ── */}
                {activeTab === 'muro' && (
                    <div className="mx-auto d-flex flex-column flex-grow-1" style={{ maxWidth: '100%', width: '100%', minHeight: 0 }}>
                        <div className="community-feed bg-dark bg-opacity-30 rounded-5 border border-white border-opacity-5 p-2 mb-2 backdrop-blur-xl shadow-2xl flex-grow-1" style={{ minHeight: 0, overflowY: "auto" }}>
                            {loadingFeed ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                                feedItems.map(item => {
                                    const isMe = item.userId === user?.uid;
                                    const isCardPost = item.action === 'sale' || item.action === 'wishlist_public';
                                    return (
                                        <div key={item.id} className={`mb-2 d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div
                                                className={`d-flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                                style={{ width: '100%', maxWidth: '100%' }}
                                            >
                                                <img src={item.userPhoto || `https://ui-avatars.com/api/?name=${item.userName}&background=random`} className="rounded-circle border border-white border-opacity-10 shadow-sm mt-1" style={{ width: "32px", height: "32px", objectFit: "cover", flexShrink: 0 }} />
                                                <div
                                                    className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}
                                                    style={{ width: isCardPost ? 'calc(100% - 40px)' : 'auto', maxWidth: '100%' }}
                                                >
                                                    <span className="fw-bold text-white-50 extra-small mb-1">{item.userName}</span>
                                                    {item.action === 'sale' ? (() => {
                                                        const listingStatus = item.listingId ? listingStatuses[item.listingId] : null;
                                                        const isPendingAdmin = listingStatus === 'pending_admin';
                                                        return (
                                                        <div
                                                            className="rounded-4 p-3 shadow-sm position-relative overflow-hidden"
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                width: '75%',
                                                                maxWidth: '75%',
                                                                border: isPendingAdmin ? '2px solid var(--pocky-purple)' : '2px solid rgba(16, 185, 129, 0.9)',
                                                                background: isPendingAdmin ? 'rgba(88, 28, 135, 0.06)' : 'transparent',
                                                                transition: 'all 0.4s ease'
                                                            }}
                                                        >
                                                            {isPendingAdmin && (
                                                                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'rgba(88,28,135,0.05)', pointerEvents: 'none', zIndex: 1 }} />
                                                            )}
                                                            {isPendingAdmin && (
                                                                <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 2 }}>
                                                                    <span className="badge rounded-pill bg-purple fw-bold animate-pulse" style={{ fontSize: '0.58rem', letterSpacing: '0.5px' }}>
                                                                        <i className="bi bi-clock-history me-1"></i>EN TRATOS
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="d-flex align-items-stretch gap-3">
                                                                <div className="d-flex align-items-center justify-content-center flex-shrink-0">
                                                                    <img src={item.cardImage} style={{ height: "113px", width: "80px", objectFit: "contain", flexShrink: 0, filter: isPendingAdmin ? 'grayscale(30%) brightness(0.85)' : 'none', transition: 'filter 0.4s ease' }} />
                                                                </div>
                                                                <div className="min-w-0 d-flex flex-column justify-content-between flex-grow-1">
                                                                    <div className="min-w-0">
                                                                        <p className="mb-1 text-white fw-bold" style={{ fontSize: '0.85rem', lineHeight: 1.15 }}>{item.cardName}</p>
                                                                        {item.cardSet && <p className="mb-1 text-white-50" style={{ fontSize: '0.68rem', lineHeight: 1.2 }}>{item.cardSet}</p>}
                                                                        {item.cardRarity && <p className="mb-0 text-white-50" style={{ fontSize: '0.66rem', lineHeight: 1.2 }}>Rareza: {item.cardRarity}</p>}
                                                                    </div>
                                                                    <div className="mt-2 d-flex flex-column gap-1">
                                                                        <div className="d-flex align-items-center justify-content-between gap-2">
                                                                            <span className="fw-bold" style={{ fontSize: '0.85rem', lineHeight: 1, color: isPendingAdmin ? 'var(--pocky-purple)' : 'var(--pocky-primary)' }}>{formatPrice(getDisplayPriceMxn(item)) || "Sin precio"}</span>
                                                                            {isPendingAdmin ? (
                                                                                <span className="btn btn-sm rounded-pill px-3 py-1 fw-bold flex-shrink-0 disabled" style={{ fontSize: '0.7rem', minWidth: '80px', background: 'rgba(88,28,135,0.25)', color: 'var(--pocky-purple)', border: '1px solid rgba(88,28,135,0.4)', cursor: 'default' }}>En mediación</span>
                                                                            ) : (
                                                                                <button className="btn btn-emerald btn-sm rounded-pill px-3 py-1 fw-bold flex-shrink-0" onClick={() => handleClaimClick(item)} style={{ fontSize: '0.7rem', minWidth: '80px' }}>Claim</button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        );
                                                    })() : item.action === 'wishlist_public' ? (
                                                        <div
                                                            className="rounded-4 p-3 shadow-lg position-relative overflow-hidden"
                                                            style={{
                                                                fontSize: '0.85rem',
                                                                width: '85%',
                                                                maxWidth: '85%',
                                                                border: '2px solid rgba(255, 75, 145, 0.8)',
                                                                background: 'linear-gradient(145deg, rgba(255, 75, 145, 0.1) 0%, transparent 100%)'
                                                            }}
                                                        >
                                                            <div className="position-absolute top-0 end-0 px-3 py-1 bg-pink text-white fw-bold rounded-bl-3" style={{ fontSize: '0.7rem' }}>Buscando</div>
                                                            <div className="d-flex align-items-stretch gap-3 mt-2">
                                                                <div className="d-flex align-items-center justify-content-center flex-shrink-0">
                                                                    <img src={item.cardImage} style={{ height: "130px", width: "90px", objectFit: "contain", flexShrink: 0, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} />
                                                                </div>
                                                                <div className="min-w-0 d-flex flex-column justify-content-between flex-grow-1">
                                                                    <div className="min-w-0 pt-1">
                                                                        <p className="mb-1 text-white fw-bold" style={{ fontSize: '1rem', lineHeight: 1.1 }}>{item.cardName}</p>
                                                                        {item.cardSet && <p className="mb-1 text-white-50" style={{ fontSize: '0.75rem', lineHeight: 1.2 }}>{item.cardSet}</p>}
                                                                    </div>
                                                                    <div className="d-flex align-items-end justify-content-end mt-3">
                                                                        <button className="btn btn-pink rounded-pill px-4 py-2 fw-bold text-white shadow-sm transition-all hover-scale-105" onClick={() => handleWishlistInterest(item)} style={{ fontSize: '0.85rem' }}><i className="bi bi-bag-check-fill me-2"></i>¡Tengo esto!</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`p-2 px-3 rounded-4 ${isMe ? 'bg-emerald bg-opacity-20 border-emerald border-opacity-30 shadow-emerald-sm' : 'bg-dark bg-opacity-60 border-white border-opacity-10'}`} style={{ wordBreak: 'break-word', fontSize: '0.85rem' }}>
                                                            <p className="mb-0 text-white small">{item.message}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={feedEndRef} />
                        </div>
                        <div className="input-group rounded-pill overflow-hidden border border-white border-opacity-10 bg-dark bg-opacity-60 backdrop-blur-xl p-1 shadow-2xl flex-shrink-0">
                            <input type="text" className="form-control border-0 bg-transparent text-white ps-3 py-2" placeholder="Comparte..." value={feedText} onChange={e => e.key === 'Enter' && handleSendFeed()} style={{ fontSize: '0.9rem' }} />
                            <button className="btn btn-emerald rounded-pill px-3 ms-1 transition-all" onClick={handleSendFeed}><i className="bi bi-send-fill"></i></button>
                        </div>
                    </div>
                )}

                {/* ── TAB: MENSAJES (CHATS) ── */}
                {activeTab === 'mensajes' && (
                    <div className="row g-2" style={{ height: "clamp(300px, calc(100dvh - 240px), 600px)" }}>
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
                                                    <div className={`p-2 px-3 rounded-4 shadow-sm ${isMine ? 'bg-emerald bg-opacity-20 border border-emerald border-opacity-20 rounded-tr-0 text-white' : 'bg-dark bg-opacity-50 border border-white border-opacity-10 rounded-tl-0 text-white'}`} style={{ maxWidth: '80%' }}>
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
                    <div className="d-flex flex-column gap-2 mx-auto" style={{ maxWidth: '700px', maxHeight: 'clamp(300px, calc(100dvh - 200px), 600px)', overflowY: 'auto' }}>
                        {loadingNotifs ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                            notifications.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-bell-slash fs-1 d-block mb-2"></i>Sin alertas</div> : (
                                notifications.map(n => (
                                    <div key={n.id} className={`notification-card rounded-3 p-2 p-md-3 border border-white border-opacity-5 bg-dark bg-opacity-40 shadow-lg backdrop-blur-md transition-all ${n.read ? 'opacity-50' : 'hover-translate-y-n1'}`} style={{ borderLeft: n.read ? '3px solid transparent' : '3px solid var(--pocky-primary)' }}>
                                        <div className="d-flex align-items-center gap-2 gap-md-3">
                                            <div className="bg-black bg-opacity-30 rounded-2 p-1 flex-shrink-0" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                                                <img src={n.cardImage || "https://ui-avatars.com/api/?name=N&background=10b981"} className="w-100 h-100 object-fit-contain" />
                                            </div>
                                            <div className="flex-grow-1 min-w-0">
                                                <h6 className={`${n.read ? 'text-white-50' : 'text-emerald'} fw-bold mb-1 text-truncate`} style={{ fontSize: '0.9rem' }}>{n.title}</h6>
                                                
                                                {n.type === 'sale_offer' ? (
                                                    <div className="mt-2 p-3 bg-dark bg-opacity-60 rounded-4 border border-emerald border-opacity-30">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span className="text-white-50" style={{ fontSize: '0.8rem' }}>De: <strong className="text-white">{n.offerFromName}</strong></span>
                                                            <span className="text-emerald fw-bold fs-5">{n.offerAmount} {n.offerCurrency}</span>
                                                        </div>
                                                        <p className="text-white mb-3" style={{ fontSize: '0.85rem' }}>Publicación: <strong>{n.listingTitle}</strong></p>
                                                        
                                                        {n.status === 'pending' ? (
                                                            <div className="d-flex gap-2">
                                                                <button className="btn btn-emerald flex-grow-1 fw-bold py-2 rounded-3 shadow-emerald" onClick={() => handleAcceptOffer(n)} style={{ fontSize: '0.85rem' }}>
                                                                    <i className="bi bi-check-lg me-1"></i>Aceptar
                                                                </button>
                                                                <button className="btn btn-outline-light flex-grow-1 fw-bold py-2 rounded-3" onClick={() => openCounterOfferModal(n)} style={{ fontSize: '0.85rem' }}>
                                                                    <i className="bi bi-arrow-left-right me-1"></i>Contraoferta
                                                                </button>
                                                            </div>
                                                        ) : n.status === 'accepted' ? (
                                                            <div className="text-emerald fw-bold text-center w-100 p-2 bg-emerald bg-opacity-10 rounded-3" style={{ fontSize: '0.85rem' }}>
                                                                <i className="bi bi-check-circle-fill me-2"></i>Aceptada
                                                            </div>
                                                        ) : n.status === 'countered' ? (
                                                            <div className="text-warning fw-bold text-center w-100 p-2 bg-warning bg-opacity-10 rounded-3" style={{ fontSize: '0.85rem' }}>
                                                                <i className="bi bi-arrow-left-right me-2"></i>Contraoferta ({n.counterAmount} {n.counterCurrency})
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-white-50 mb-2" style={{ fontSize: '0.8rem' }}>{n.message}</p>
                                                        <Link to={n.link || '/'} className="text-emerald text-decoration-none fw-bold hover-underline" onClick={() => markAsRead(user.uid, n.id)} style={{ fontSize: '0.8rem' }}>Ver ahora →</Link>
                                                    </>
                                                )}
                                            </div>
                                            {!n.read && <div className="bg-warning rounded-circle shadow-emerald" style={{ width: '8px', height: '8px', flexShrink: 0 }}></div>}
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}

                {/* ── TAB: TICKETS (ADMIN ONLY) ── */}
                {activeTab === 'tickets' && isUserAdmin && (
                    <div className="mx-auto w-100" style={{ maxWidth: '860px' }}>
                        {/* Pending tickets */}
                        {transactions.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length === 0
                            ? <div className="text-center py-5 opacity-20"><i className="bi bi-ticket-perforated fs-1 d-block mb-2"></i>No hay tickets pendientes</div>
                            : (
                                <div className="d-flex flex-column gap-2" style={{ overflowY: 'auto', maxHeight: 'calc(100dvh - 260px)' }}>
                                    {transactions.filter(t => t.status !== 'completed' && t.status !== 'cancelled').map(t => (
                                        <div key={t.id} className="rounded-4 border border-white border-opacity-10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            {/* Header row */}
                                            <div className="d-flex align-items-center gap-3 p-3">
                                                <img src={t.cardImage} style={{ width: '36px', height: '50px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
                                                <div className="flex-grow-1 min-w-0">
                                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                                        <span className={`badge rounded-pill small ${t.status === 'accepted' ? 'bg-emerald bg-opacity-20 text-emerald' : 'bg-warning bg-opacity-20 text-warning'}`}>
                                                            {t.status === 'accepted' ? 'Aceptada' : 'Contraoferta'}
                                                        </span>
                                                        <span className="text-white-50 extra-small">#{t.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                    <p className="text-white fw-bold mb-0 text-truncate" style={{ fontSize: '0.88rem' }}>{t.listingTitle}</p>
                                                </div>
                                                <div className="text-end flex-shrink-0">
                                                    <span className="text-emerald fw-bold d-block" style={{ fontSize: '1rem' }}>{t.amount} {t.currency}</span>
                                                    <small className="text-white-50" style={{ fontSize: '0.6rem' }}>Mediación</small>
                                                </div>
                                            </div>

                                            {/* Parties + Actions */}
                                            <div className="d-flex gap-2 px-3 pb-3 flex-wrap">
                                                <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-40 rounded-3 px-2 py-1 flex-grow-1" style={{ minWidth: '120px' }}>
                                                    <i className="bi bi-person-fill text-white-50" style={{ fontSize: '0.7rem' }}></i>
                                                    <span className="text-white small text-truncate fw-bold" style={{ fontSize: '0.78rem' }}>{t.sellerName}</span>
                                                    <button className="btn btn-sm p-0 ms-auto" style={{ lineHeight: 1 }} onClick={() => handleAdminStartChat({ id: t.sellerId, name: t.sellerName }, `Hola ${t.sellerName}, soy el admin revisando tu trato por ${t.listingTitle}`)}>
                                                        <i className="bi bi-chat-fill text-emerald" style={{ fontSize: '0.75rem' }}></i>
                                                    </button>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-40 rounded-3 px-2 py-1 flex-grow-1" style={{ minWidth: '120px' }}>
                                                    <i className="bi bi-bag-fill text-white-50" style={{ fontSize: '0.7rem' }}></i>
                                                    <span className="text-white small text-truncate fw-bold" style={{ fontSize: '0.78rem' }}>{t.buyerName}</span>
                                                    <button className="btn btn-sm p-0 ms-auto" style={{ lineHeight: 1 }} onClick={() => handleAdminStartChat({ id: t.buyerId, name: t.buyerName }, `Hola ${t.buyerName}, soy el admin revisando tu trato por ${t.listingTitle}`)}>
                                                        <i className="bi bi-chat-fill text-emerald" style={{ fontSize: '0.75rem' }}></i>
                                                    </button>
                                                </div>
                                                <button className="btn btn-sm btn-emerald fw-bold rounded-3 px-3 shadow-emerald" onClick={() => handleUpdateTicket(t, "completed")} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                    <i className="bi bi-check-all me-1"></i>Concretar
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger fw-bold rounded-3 px-3" onClick={() => handleUpdateTicket(t, "cancelled")} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                    <i className="bi bi-x-circle me-1"></i>Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                        
                        {/* Historial rápido opcional */}
                        {transactions.filter(t => t.status === 'completed' || t.status === 'cancelled').length > 0 && (
                            <div className="mt-4">
                                <h6 className="text-white-50 small uppercase mb-3 px-2">Historial Reciente</h6>
                                {transactions.filter(t => t.status === 'completed' || t.status === 'cancelled').slice(0, 5).map(t => (
                                    <div key={t.id} className="p-2 px-3 bg-dark bg-opacity-20 rounded-pill border border-white border-opacity-5 mb-1 d-flex justify-content-between align-items-center opacity-50">
                                        <small className="text-white">{t.listingTitle}</small>
                                        <span className={`extra-small fw-bold ${t.status === 'completed' ? 'text-emerald' : 'text-danger'}`}>
                                            {t.status === 'completed' ? 'CONCRETADA' : 'CANCELADA'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <OfferModal
                isOpen={offerModal.open}
                title={offerModal.mode === "offer" ? "Hacer una Oferta" : "Contraoferta"}
                amount={offerAmount}
                currency={offerCurrency}
                loading={submittingOffer}
                onAmountChange={setOfferAmount}
                onClose={closeOfferModal}
                onSubmit={offerModal.mode === "offer" ? submitOffer : submitCounterOffer}
            />

            <style>{`
                .activity-tabs { top: 0.5rem; }
                @media (min-width: 992px) {
                    .activity-tabs { top: 70px; }
                }
                .community-feed {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .community-feed::-webkit-scrollbar {
                    display: none;
                }
                .notification-card { border-left: 4px solid var(--pocky-primary) !important; }
                .btn-pink { background: #ff4b91; border: none; color: white; }
                .btn-pink:hover { background: #e63e7d; transform: scale(1.02); }
                .border-pink { border-color: rgba(255, 75, 145, 0.3) !important; }
            `}</style>
        </div>
    );
}
