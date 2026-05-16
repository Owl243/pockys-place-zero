import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { getInventory, saveCard } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { postToFeed, postWishlistPublic, removeWishlistPublic, syncSaleFeedPost } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";
import { getDisplayName, getDisplayPriceMxn } from "../utils/cardUtils";
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { closeListingByInventoryCard, createListing, listenUserListings, updateListingFromInventoryCard } from "../services/listingsService";

function SellPublishModal({ open, draft, onChange, onClose, onConfirm }) {
    if (!open) return null;

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 9999 }} onClick={onClose}>
            <div className="bg-dark rounded-5 border border-white border-opacity-10 shadow-2xl p-4 w-100" style={{ maxWidth: "420px" }} onClick={(event) => event.stopPropagation()}>
                <h5 className="fw-bold text-white mb-2">Publicar en venta</h5>
                <p className="text-white-50 small mb-3">Confirma nombre, precio y entrega.</p>
                <div className="d-flex flex-column gap-3">
                    <input className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white" value={draft.customName} onChange={(event) => onChange("customName", event.target.value)} />
                    <input type="number" min="0" step="0.01" className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white" value={draft.customPriceMxn} onChange={(event) => onChange("customPriceMxn", event.target.value)} />
                    <div className="d-flex flex-wrap gap-2">
                        {["Envio", "Blanquita"].map((pref) => (
                            <button key={pref} type="button" className={`btn btn-sm rounded-pill fw-bold ${draft.deliveryPrefs.includes(pref) ? "btn-emerald text-white" : "btn-outline-light"}`} onClick={() => onChange("deliveryPrefs", draft.deliveryPrefs.includes(pref) ? draft.deliveryPrefs.filter((item) => item !== pref) : [...draft.deliveryPrefs, pref])}>
                                {pref}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-outline-light rounded-pill flex-grow-1" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-emerald rounded-pill flex-grow-1 fw-bold" onClick={onConfirm} disabled={!draft.customName.trim() || draft.customPriceMxn === ""}>Publicar</button>
                </div>
            </div>
        </div>
    );
}

export default function Collection() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();

    const [activeTab, setActiveTab] = useState("inventory");
    const [inventory, setInventory] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publicWishlistIds, setPublicWishlistIds] = useState(new Set());
    const [drafts, setDrafts] = useState({});
    const [sellDraft, setSellDraft] = useState({ open: false, card: null, customName: "", customPriceMxn: "", deliveryPrefs: [] });

    const user = auth.currentUser;

    const loadData = async () => {
        if (!user) return;
        const data = await getInventory(user.uid);
        const inventoryCards = data.filter((card) => card.inInventory);
        const wishlistCards = data.filter((card) => card.inWishlist);

        // Fetch active listings to sync forSale status
        const activeListingsQuery = query(collection(db, "listings"), where("ownerId", "==", user.uid), where("status", "==", "active"));
        const activeListingsSnap = await getDocs(activeListingsQuery);
        const activeCardIds = new Set(activeListingsSnap.docs.map(d => d.data().inventoryCardId));

        // Sync forSale status in inventory if it's out of sync
        for (const card of inventoryCards) {
            const actuallyForSale = activeCardIds.has(card.id);
            if (card.forSale !== actuallyForSale) {
                await saveCard(user.uid, card, { ...card, forSale: actuallyForSale });
                card.forSale = actuallyForSale; // Update local object for immediate UI response
            }
        }

        setInventory(inventoryCards);
        setWishlist(wishlistCards);
        setDrafts(Object.fromEntries(inventoryCards.map((card) => [card.id, {
            customName: card.customName || card.name || "",
            customPriceMxn: card.customPriceMxn ?? ""
        }])));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "feed"), where("userId", "==", user.uid), where("action", "==", "wishlist_public"));
        const unsub = onSnapshot(q, (snap) => {
            setPublicWishlistIds(new Set(snap.docs.map((docItem) => docItem.data().cardId)));
        });
        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const unsub = listenUserListings(user.uid, setListings);
        return () => unsub();
    }, [user]);

    const handleDraftChange = (cardId, field, value) => {
        setDrafts((current) => ({
            ...current,
            [cardId]: {
                ...current[cardId],
                [field]: value
            }
        }));
    };

    const handleInventoryAction = async (card, actionType) => {
        if (!user) return;

        if (actionType === "save") {
            const draft = drafts[card.id] || {};
            const updatedCard = {
                ...card,
                customName: draft.customName?.trim() || card.name,
                customPriceMxn: draft.customPriceMxn === "" ? null : Number(draft.customPriceMxn)
            };
            await saveCard(user.uid, card, updatedCard);
            await updateListingFromInventoryCard(user.uid, updatedCard);
            if (card.forSale) {
                await syncSaleFeedPost(user.uid, updatedCard, {
                    userName: user.displayName || user.email.split("@")[0],
                    userPhoto: user.photoURL,
                    userObj: user,
                    listingId: card.listingId || null
                });
            }
            showToast("Cambios guardados", "success");
        } else if (actionType === "remove") {
            const hasActiveOrPending = listings.some(l => l.inventoryCardId === card.id && (l.status === "active" || l.status === "pending_admin"));
            if (hasActiveOrPending) {
                showToast("No puedes eliminar una carta que tiene una venta activa o en tratos", "error");
                return;
            }
            await saveCard(user.uid, card, { ...card, inInventory: false });
            showToast(`${getDisplayName(card)} eliminado`, "error");
        } else if (actionType === "sale") {
            const draft = drafts[card.id] || {};
            const activeListing = listings.find(l => l.inventoryCardId === card.id && (l.status === "active" || l.status === "pending_admin"));
            
            if (activeListing) {
                if (activeListing.status === "pending_admin") {
                    showToast("Esta venta está en proceso de mediación y no se puede retirar", "warning");
                    return;
                }

                const updatedCard = {
                    ...card,
                    customName: draft.customName?.trim() || card.customName || card.name,
                    customPriceMxn: draft.customPriceMxn === "" ? null : Number(draft.customPriceMxn ?? card.customPriceMxn)
                };
                await closeListingByInventoryCard(user.uid, card.id);
                await saveCard(user.uid, card, { ...updatedCard, forSale: false });
                await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, "sale_finished", updatedCard, user);
                showToast("Venta retirada", "success");
            } else {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                setSellDraft({
                    open: true,
                    card,
                    customName: draft.customName?.trim() || card.customName || card.name,
                    customPriceMxn: draft.customPriceMxn ?? "",
                    deliveryPrefs: userDoc.exists()
                        ? (userDoc.data().deliveryPrefs || []).filter((item) => item !== "Metro (CDMX)" && item !== "Frikiplaza")
                        : []
                });
            }
        }
        loadData();
    };

    const handleSellDraftChange = (field, value) => {
        setSellDraft((current) => ({ ...current, [field]: value }));
    };

    const handleConfirmSale = async () => {
        if (!user || !sellDraft.card) return;
        const updatedCard = {
            ...sellDraft.card,
            customName: sellDraft.customName.trim() || sellDraft.card.name,
            customPriceMxn: sellDraft.customPriceMxn === "" ? null : Number(sellDraft.customPriceMxn)
        };
        await setDoc(doc(db, "users", user.uid), { deliveryPrefs: sellDraft.deliveryPrefs }, { merge: true });
        await saveCard(user.uid, sellDraft.card, { ...updatedCard, forSale: true });
        const listing = await createListing(user, { ...updatedCard, deliveryPrefs: sellDraft.deliveryPrefs });
        await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, "sale", { ...updatedCard, listingId: listing.id }, user, { listingId: listing.id });
        setSellDraft({ open: false, card: null, customName: "", customPriceMxn: "", deliveryPrefs: [] });
        showToast("Publicacion creada", "success");
        loadData();
    };

    const handleWishlistAction = async (card, actionType) => {
        if (!user) return;
        if (actionType === "remove") {
            await saveCard(user.uid, card, { ...card, inWishlist: false });
            if (publicWishlistIds.has(card.id)) await removeWishlistPublic(user.uid, card.id);
            showToast("Eliminada de wishlist", "pink");
        } else if (actionType === "got_it") {
            await saveCard(user.uid, card, { ...card, inInventory: true, inWishlist: false });
            if (publicWishlistIds.has(card.id)) await removeWishlistPublic(user.uid, card.id);
            showToast("Movida al inventario", "success");
        } else if (actionType === "toggle_public") {
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
                <h2 className="fw-bold text-white mb-1">Mi <span className="text-emerald">Pocky</span></h2>
                <p className="text-white-50 small">Inventario editable, wishlist y publicaciones.</p>
            </div>

            <div className="d-flex justify-content-center mb-4">
                <div className="d-flex gap-1 p-1 rounded-pill bg-dark bg-opacity-50 border border-white border-opacity-10 shadow-sm flex-wrap">
                    {[
                        { key: "inventory", label: "Inventario", icon: "bi-box-seam" },
                        { key: "listings", label: "Listings", icon: "bi-tag-fill" },
                        { key: "wishlist", label: "Wishlist", icon: "bi-heart-fill" }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`btn btn-sm rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === tab.key ? "btn-emerald text-white" : "text-white-50"}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-fade-in">
                {loading ? <div className="text-center py-5"><div className="spinner-grow text-emerald"></div></div> : null}

                {!loading && activeTab === "inventory" && (
                    <div className="row g-3">
                        {inventory.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-box fs-1 d-block mb-2"></i>Vacio</div> : inventory.map((card) => {
                            const draft = drafts[card.id] || {};
                            return (
                                <div key={card.id} className="col-12 col-lg-6">
                                    <div className="card h-100 border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg">
                                        <div className="row g-0 h-100">
                                            <div className="col-4 p-3 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative" style={{ minHeight: "220px" }}>
                                                <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 drop-shadow-card" />
                                                {(() => {
                                                    const l = listings.find(listing => listing.inventoryCardId === card.id && (listing.status === "active" || listing.status === "pending_admin"));
                                                    if (!l) return null;
                                                    if (l.status === "pending_admin") return <span className="position-absolute top-0 end-0 m-2 badge bg-purple rounded-pill fw-bold shadow-purple-sm">EN TRATO</span>;
                                                    return <span className="position-absolute top-0 end-0 m-2 badge bg-danger rounded-pill fw-bold">VENTA</span>;
                                                })()}
                                            </div>
                                            <div className="col-8">
                                                <div className="card-body p-3 d-flex flex-column gap-2 h-100">
                                                    <input className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white" value={draft.customName ?? ""} onChange={(event) => handleDraftChange(card.id, "customName", event.target.value)} />
                                                    <input type="number" min="0" step="0.01" className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white" placeholder="Precio MXN" value={draft.customPriceMxn ?? ""} onChange={(event) => handleDraftChange(card.id, "customPriceMxn", event.target.value)} />
                                                    <div>
                                                        <h6 className="fw-bold text-white text-truncate small mb-1">{getDisplayName({ ...card, customName: draft.customName })}</h6>
                                                        <p className="text-white-50 extra-small mb-1">#{card.number} - {card.setName}</p>
                                                        <p className="text-emerald fw-bold mb-0">{formatPrice(draft.customPriceMxn === "" ? getDisplayPriceMxn(card) : Number(draft.customPriceMxn)) || "Sin precio"}</p>
                                                    </div>
                                                    <div className="d-flex gap-1 mt-auto flex-wrap">
                                                        <button className="btn btn-outline-light btn-sm rounded-3 flex-grow-1 fw-bold" onClick={() => handleInventoryAction(card, "save")}>Guardar</button>
                                                        {(() => {
                                                            const l = listings.find(listing => listing.inventoryCardId === card.id && (listing.status === "active" || listing.status === "pending_admin"));
                                                            if (!l) return <button className="btn btn-sm btn-outline-danger rounded-pill flex-grow-1 fw-bold" onClick={() => handleInventoryAction(card, "sale")}>Publicar</button>;
                                                            if (l.status === "pending_admin") return <button className="btn btn-sm btn-purple rounded-pill flex-grow-1 fw-bold text-white shadow-purple-sm" onClick={() => handleInventoryAction(card, "sale")}><i className="bi bi-lock-fill me-1"></i>En trato</button>;
                                                            return <button className="btn btn-sm btn-danger rounded-pill flex-grow-1 fw-bold" onClick={() => handleInventoryAction(card, "sale")}>Cerrar</button>;
                                                        })()}
                                                        <button className="btn btn-outline-secondary btn-sm rounded-3 px-2" onClick={() => handleInventoryAction(card, "remove")}><i className="bi bi-trash3 text-white-50"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && activeTab === "listings" && (
                    <div className="row g-3">
                        {listings.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-tag fs-1 d-block mb-2"></i>Sin publicaciones</div> : listings.map((listing) => (
                            <div key={listing.id} className="col-12 col-md-6 col-lg-4">
                                <div className="card h-100 border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg">
                                    <div className="p-3 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ height: "180px" }}>
                                        <img src={listing.cardImage} className="img-fluid h-100 object-fit-contain w-100 drop-shadow-card" />
                                    </div>
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className={`badge rounded-pill ${listing.status === "active" ? "bg-emerald" : "bg-secondary"}`}>{listing.status}</span>
                                            <span className="text-emerald fw-bold">{formatPrice(listing.priceMxn) || "Sin precio"}</span>
                                        </div>
                                        <h6 className="fw-bold text-white text-truncate small mb-1">{listing.title}</h6>
                                        <p className="text-white-50 extra-small mb-0">#{listing.cardNumber} - {listing.cardSetName}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && activeTab === "wishlist" && (
                    <div className="row g-3">
                        {wishlist.length === 0 ? <div className="text-center py-5 opacity-20"><i className="bi bi-heart fs-1 d-block mb-2"></i>Deseos vacios</div> : wishlist.map((card) => (
                            <div key={card.id} className="col-6 col-md-4 col-lg-3">
                                <div className="card h-100 border-0 rounded-4 overflow-hidden bg-dark bg-opacity-30 border border-white border-opacity-5 shadow-lg">
                                    <div className="p-3 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative" style={{ height: "180px" }}>
                                        <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 drop-shadow-card" />
                                        {publicWishlistIds.has(card.id) && <span className="position-absolute top-0 start-0 m-2 badge text-info rounded-pill fw-bold border border-info bg-transparent">PUBLICO</span>}
                                    </div>
                                    <div className="card-body p-3">
                                        <h6 className="fw-bold text-white text-truncate small mb-1">{getDisplayName(card)}</h6>
                                        <button className="btn btn-sm btn-outline-pink w-100 rounded-3 mb-2 fw-bold" onClick={() => handleWishlistAction(card, "got_it")}>Ya la tengo</button>
                                        <div className="d-flex gap-1">
                                            <button className={`btn btn-sm rounded-3 flex-grow-1 fw-bold ${publicWishlistIds.has(card.id) ? "btn-emerald" : "btn-dark bg-opacity-50 border-white border-opacity-10 text-white-50"}`} onClick={() => handleWishlistAction(card, "toggle_public")}>{publicWishlistIds.has(card.id) ? "Visible" : "Oculto"}</button>
                                            <button className="btn btn-outline-secondary btn-sm rounded-3 px-2" onClick={() => handleWishlistAction(card, "remove")}><i className="bi bi-trash3 text-white-50"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .btn-outline-pink { border: 1.5px solid #ff4b91; color: #ff4b91; background: transparent; }
                .drop-shadow-card { filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)); }
            `}</style>
            <SellPublishModal
                open={sellDraft.open}
                draft={sellDraft}
                onChange={handleSellDraftChange}
                onClose={() => setSellDraft({ open: false, card: null, customName: "", customPriceMxn: "", deliveryPrefs: [] })}
                onConfirm={handleConfirmSale}
            />
        </div>
    );
}
