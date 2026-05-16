import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getInventory, saveCard } from "../services/inventoryService";
import { useToast } from "../context/ToastContext";
import { postToFeed, syncSaleFeedPost } from "../services/feedService";
import { useCurrency } from "../context/CurrencyContext";
import { getDisplayName, getDisplayPriceMxn } from "../utils/cardUtils";
import { closeListingByInventoryCard, createListing, updateListingFromInventoryCard } from "../services/listingsService";

export default function Inventory() {
    const showToast = useToast();
    const { formatPrice } = useCurrency();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState({});

    const load = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const data = await getInventory(user.uid);
        const inventoryCards = data.filter((card) => card.inInventory);
        setCards(inventoryCards);
        setDrafts(Object.fromEntries(inventoryCards.map((card) => [card.id, {
            customName: card.customName || card.name || "",
            customPriceMxn: card.customPriceMxn ?? ""
        }])));
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleDraftChange = (cardId, field, value) => {
        setDrafts((current) => ({
            ...current,
            [cardId]: {
                ...current[cardId],
                [field]: value
            }
        }));
    };

    const handleSaveCustomData = async (card) => {
        const user = auth.currentUser;
        if (!user) return;

        const draft = drafts[card.id] || {};
        const customPriceMxn = draft.customPriceMxn === "" ? null : Number(draft.customPriceMxn);
        const updatedCard = {
            ...card,
            customName: draft.customName?.trim() || card.name,
            customPriceMxn
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
        showToast("Articulo actualizado", "success");
        load();
    };

    const handleRemove = async (card) => {
        const user = auth.currentUser;
        if (!user) return;

        if (card.forSale) {
            showToast("Debes cerrar la publicacion antes de eliminar del inventario", "error");
            return;
        }

        await saveCard(user.uid, card, { ...card, inInventory: false });
        showToast(`${getDisplayName(card)} eliminado del inventario`, "error");
        load();
    };

    const handleSale = async (card) => {
        const user = auth.currentUser;
        if (!user) return;

        const draft = drafts[card.id] || {};
        const customName = draft.customName?.trim() || card.customName || card.name;
        const customPriceMxn = draft.customPriceMxn === "" ? null : Number(draft.customPriceMxn ?? card.customPriceMxn);
        const updatedCard = { ...card, customName, customPriceMxn };
        const newStatus = !card.forSale;

        await saveCard(user.uid, card, { ...updatedCard, forSale: newStatus });

        if (newStatus) {
            const listing = await createListing(user, updatedCard);
            await postToFeed(
                user.uid,
                user.displayName || user.email.split("@")[0],
                user.photoURL,
                "sale",
                { ...updatedCard, listingId: listing.id },
                user,
                { listingId: listing.id }
            );
        } else {
            await closeListingByInventoryCard(user.uid, card.id);
            await postToFeed(user.uid, user.displayName || user.email.split("@")[0], user.photoURL, "sale_finished", updatedCard, user);
        }

        showToast(newStatus ? `${customName} puesto en venta` : `${customName} retirado de venta`, newStatus ? "error" : "success");
        load();
    };

    return (
        <div className="container py-3 mb-5">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div className="text-start">
                    <h2 className="fw-bold mb-1 text-white tracking-tight">Mi <span className="text-emerald">Inventario</span></h2>
                    <p className="text-light-muted small mb-0">Edita tu nombre y precio en MXN antes de publicar.</p>
                </div>
                <div className="bg-emerald bg-opacity-10 px-3 py-2 rounded-4 border border-emerald border-opacity-30 shadow-emerald">
                    <span className="fw-bold text-emerald">{cards.length} Articulos</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-grow text-emerald" role="status"></div>
                </div>
            ) : cards.length === 0 ? (
                <div className="text-center py-5 bg-dark bg-opacity-25 rounded-5 border border-white border-opacity-5">
                    <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
                    <p className="text-muted">Aun no tienes cartas en tu inventario.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {cards.map((card) => {
                        const draft = drafts[card.id] || {};
                        return (
                            <div className="col-12 col-md-6 col-lg-4" key={card.id}>
                                <div className="card h-100 border-0 rounded-5 overflow-hidden bg-dark bg-opacity-30 backdrop-blur-sm border border-white border-opacity-5 shadow-2xl">
                                    <div className="p-4 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ height: "260px" }}>
                                        <div className="position-absolute w-100 h-100 bg-emerald opacity-20" style={{ filter: "blur(60px)", top: 0, left: 0 }}></div>
                                        <img src={card.image} className="img-fluid h-100 object-fit-contain w-100 position-relative z-1 drop-shadow-card" />
                                        {card.forSale && (
                                            <span className="position-absolute top-0 end-0 m-3 badge text-danger border border-danger border-opacity-30 rounded-pill px-2 py-1">
                                                En venta
                                            </span>
                                        )}
                                    </div>
                                    <div className="card-body p-4 d-flex flex-column gap-3">
                                        <div>
                                            <label className="form-label text-white-50 small mb-1">Nombre visible</label>
                                            <input
                                                className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white"
                                                value={draft.customName ?? ""}
                                                onChange={(event) => handleDraftChange(card.id, "customName", event.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label text-white-50 small mb-1">Precio MXN</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="form-control bg-black bg-opacity-40 border-white border-opacity-10 text-white"
                                                value={draft.customPriceMxn ?? ""}
                                                onChange={(event) => handleDraftChange(card.id, "customPriceMxn", event.target.value)}
                                            />
                                            <div className="small text-white-50 mt-2">
                                                Visible: {formatPrice(getDisplayPriceMxn({
                                                    ...card,
                                                    customPriceMxn: draft.customPriceMxn === "" ? null : Number(draft.customPriceMxn)
                                                })) || "Sin precio"}
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1 text-white">{getDisplayName(card)}</h6>
                                            <p className="text-light-muted mb-0" style={{ fontSize: "0.75rem" }}>
                                                #{card.number} / {card.rarity || "Common"} - {card.setName || "Set desconocido"}
                                            </p>
                                        </div>
                                        <div className="d-flex gap-2 mt-auto">
                                            <button className="btn btn-outline-light flex-grow-1 rounded-4 py-2 fw-bold" onClick={() => handleSaveCustomData(card)}>
                                                Guardar
                                            </button>
                                            <button
                                                className={`btn ${card.forSale ? "btn-danger shadow-danger-sm" : "btn-outline-danger"} flex-grow-1 rounded-4 py-2 fw-bold`}
                                                onClick={() => handleSale(card)}
                                            >
                                                {card.forSale ? "Cerrar venta" : "Publicar"}
                                            </button>
                                            <button className="btn btn-outline-secondary border-opacity-25 rounded-4 py-2 fw-bold text-white" onClick={() => handleRemove(card)}>
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .drop-shadow-card { filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(var(--pocky-primary-rgb), 0.2)); }
                .shadow-danger-sm { box-shadow: 0 0 10px rgba(220, 53, 69, 0.3); }
            `}</style>
        </div>
    );
}
