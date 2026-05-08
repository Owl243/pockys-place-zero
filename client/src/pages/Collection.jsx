import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { getInventory, saveCard } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { postToFeed, postWishlistPublic, removeWishlistPublic } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";
import { getPriceRaw } from "../utils/cardUtils";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Collection() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "wishlist"
    const [inventory, setInventory] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publicWishlistIds, setPublicWishlistIds] = useState(new Set());
    
    const user = auth.currentUser;

    const loadData = async () => {
        if (!user) return;
        const data = await getInventory(user.uid);
        setInventory(data.filter(c => c.inInventory));
        setWishlist(data.filter(c => c.inWishlist));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "feed"), where("userId", "==", user.uid), where("action", "==", "wishlist_public"));
        const unsub = onSnapshot(q, snap => {
            setPublicWishlistIds(new Set(snap.docs.map(d => d.data().cardId)));
        });
        return () => unsub();
    }, [user]);

    const handleInventoryAction = async (card, actionType) => {
        if (actionType === 'remove') {
            if (card.forSale) {
                showToast("Quita la venta antes de eliminar", "error");
                return;
            }
            await saveCard(user.uid, card, { ...card, inInventory: false });
            showToast(`${card.name} eliminada`, "error");
        } else if (actionType === 'sale') {
            const newStatus = !card.forSale;
            await saveCard(user.uid, card, { ...card, forSale: newStatus });
            if (newStatus) await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, 'sale', card, user);
            showToast(newStatus ? "Puesta en venta" : "Retirada de venta", newStatus ? "error" : "success");
        }
        loadData();
    };

    const handleWishlistAction = async (card, actionType) => {
        if (actionType === 'remove') {
            await saveCard(user.uid, card, { ...card, inWishlist: false });
            if (publicWishlistIds.has(card.id)) await removeWishlistPublic(user.uid, card.id);
            showToast("Eliminada de wishlist", "pink");
        } else if (actionType === 'got_it') {
            await saveCard(user.uid, card, { ...card, inInventory: true, inWishlist: false });
            if (publicWishlistIds.has(card.id)) await removeWishlistPublic(user.uid, card.id);
            showToast("¡Movida al inventario!", "success");
        } else if (actionType === 'toggle_public') {
            const isPublic = publicWishlistIds.has(card.id);
            if (isPublic) {
                await removeWishlistPublic(user.uid, card.id);
                showToast("Oculta de comunidad", "pink");
            } else {
                await postWishlistPublic(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, card);
                showToast("Visible en comunidad", "success");
            }
        }
        loadData();
    };

    return (
        <div className="pb-5">
            <div className="text-center pt-4 pb-3">
                <h2 className="fw-bold text-white mb-1">Mi <span className={activeTab === 'inventory' ? 'text-emerald' : 'text-pink'}>Pocky</span></h2>
                <p className="text-white-50 small">Toda tu colección en un solo lugar</p>
            </div>

            <div className="d-flex justify-content-center mb-4">
                <div className="d-flex gap-1 p-1 rounded-pill bg-dark bg-opacity-50 border border-white border-opacity-10 shadow-sm">
                    <button className={`btn btn-sm rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === 'inventory' ? 'btn-emerald text-white' : 'text-white-50'}`} onClick={() => setActiveTab('inventory')}>
                        <i className="bi bi-box-seam me-2"></i>Inventario
                    </button>
                    <button className={`btn btn-sm rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === 'wishlist' ? 'btn-pink text-white shadow-pink-sm' : 'text-white-50'}`} onClick={() => setActiveTab('wishlist')}>
                        <i className="bi bi-heart-fill me-2"></i>Wishlist
                    </button>
                </div>
            </div>

            <div className="animate-fade-in">
                {loading ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : (
                    activeTab === 'inventory' ? (
                        <div className="row g-3">
                            {inventory.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-box fs-1 d-block mb-2"></i>Vacío</div> : (
                                inventory.map(card => (
                                    <div key={card.id} className="col-6 col-md-4 col-lg-3">
                                        <div className="card h-100 border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg">
                                            <div className="p-3 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative" style={{ height: "180px" }}>
                                                <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 drop-shadow-card" />
                                                {card.forSale && <span className="position-absolute top-0 end-0 m-2 badge bg-danger rounded-pill fw-bold" style={{ fontSize: '0.6rem' }}>VENTA</span>}
                                            </div>
                                            <div className="card-body p-3">
                                                <h6 className="fw-bold text-white text-truncate small mb-1">{card.name}</h6>
                                                <p className="text-white-50 extra-small mb-3">#{card.number} · {card.setName}</p>
                                                <div className="d-flex gap-1 mt-auto">
                                                    <button className={`btn btn-sm rounded-3 flex-grow-1 fw-bold ${card.forSale ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => handleInventoryAction(card, 'sale')} style={{ fontSize: '0.65rem' }}>{card.forSale ? 'Stop' : 'Vender'}</button>
                                                    <button className="btn btn-outline-secondary btn-sm rounded-3 px-2" onClick={() => handleInventoryAction(card, 'remove')}><i className="bi bi-trash3 text-white-50"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="row g-3">
                            {wishlist.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-heart fs-1 d-block mb-2"></i>Deseos vacíos</div> : (
                                wishlist.map(card => (
                                    <div key={card.id} className="col-6 col-md-4 col-lg-3">
                                        <div className="card h-100 border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg">
                                            <div className="p-3 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative" style={{ height: "180px" }}>
                                                <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 drop-shadow-card" />
                                                {publicWishlistIds.has(card.id) && <span className="position-absolute top-0 start-0 m-2 badge bg-info bg-opacity-20 text-info rounded-pill fw-bold" style={{ fontSize: '0.6rem' }}>PÚBLICO</span>}
                                            </div>
                                            <div className="card-body p-3">
                                                <h6 className="fw-bold text-white text-truncate small mb-1">{card.name}</h6>
                                                <button className="btn btn-sm btn-outline-pink w-100 rounded-3 mb-2 fw-bold" onClick={() => handleWishlistAction(card, 'got_it')} style={{ fontSize: '0.65rem' }}>¡Ya la tengo!</button>
                                                <div className="d-flex gap-1">
                                                    <button className={`btn btn-sm rounded-3 flex-grow-1 fw-bold ${publicWishlistIds.has(card.id) ? 'btn-emerald' : 'btn-dark bg-opacity-50 border-white border-opacity-10 text-white-50'}`} onClick={() => handleWishlistAction(card, 'toggle_public')} style={{ fontSize: '0.6rem' }}>{publicWishlistIds.has(card.id) ? 'Visible' : 'Oculto'}</button>
                                                    <button className="btn btn-outline-secondary btn-sm rounded-3 px-2" onClick={() => handleWishlistAction(card, 'remove')}><i className="bi bi-trash3 text-white-50"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                )}
            </div>

            <style>{`
                .text-emerald { color: #10b981 !important; }
                .text-pink { color: #ff4b91 !important; }
                .btn-emerald { background: #10b981; color: white; border: none; }
                .btn-pink { background: #ff4b91; color: white; border: none; }
                .btn-outline-pink { border: 1.5px solid #ff4b91; color: #ff4b91; background: transparent; }
                .shadow-pink-sm { box-shadow: 0 0 15px rgba(255, 75, 145, 0.3); }
                .animate-fade-in { animation: fadeIn 0.4s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .drop-shadow-card { filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); }
                .extra-small { font-size: 0.65rem; }
            `}</style>
        </div>
    );
}
