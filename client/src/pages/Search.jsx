import { useState, useEffect } from "react";
import { getData, toggleCard } from "../utils/storage";
import { addRequest } from "../services/firebaseService";
import { auth } from "../firebase";
import { saveCard } from "../services/inventoryService";

export default function Search() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [cards, setCards] = useState([]);
    const [userData, setUserData] = useState([]);

    useEffect(() => {
        setUserData(getData());
    }, []);

    // 🔍 AUTOCOMPLETE
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        const delay = setTimeout(async () => {
            const res = await fetch(
                `https://api.pokemontcg.io/v2/cards?q=name:${query}&pageSize=100`
            );
            const data = await res.json();

            // Obtener solo nombres únicos
            const uniqueNames = [
                ...new Set(data.data.map((c) => c.name)),
            ];

            setSuggestions(uniqueNames);
        }, 400);

        return () => clearTimeout(delay);
    }, [query]);

    // 📦 Cargar cartas al seleccionar sugerencia
    const loadCards = async (name) => {
        setQuery(name);
        setSuggestions([]);

        // 🔔 registrar búsqueda
        addRequest(name);

        const res = await fetch(
            `https://api.pokemontcg.io/v2/cards?q=name:"${name}"`
        );
        const data = await res.json();
        setCards(data.data);
    };

    const handleAction = async (card, type) => {
        const user = auth.currentUser;

        if (!user) {
            alert("Debes iniciar sesión");
            return;
        }

        if (type === "inventory") {
            await saveCard(user.uid, card, {
                inInventory: true,
                inWishlist: false,
                forSale: false,
            });
        }

        if (type === "wishlist") {
            await saveCard(user.uid, card, {
                inInventory: false,
                inWishlist: true,
                forSale: false,
            });
        }

        if (type === "sale") {
            await saveCard(user.uid, card, {
                inInventory: true,
                inWishlist: false,
                forSale: true,
            });
        }

        alert("Actualizado");
    };

    const getStatus = (id) => {
        return userData.find((c) => c.id === id);
    };

    return (
        <div>
            <h2>TCG Pokémon</h2>

            {/* 🔍 Input */}
            <div className="position-relative mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar cartas..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                {/* 📋 SUGERENCIAS */}
                {suggestions.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow">
                        {suggestions.map((name, i) => (
                            <li
                                key={i}
                                className="list-group-item list-group-item-action"
                                onClick={() => loadCards(name)}
                                style={{ cursor: "pointer" }}
                            >
                                🔍 {name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 📦 RESULTADOS */}
            <div className="row">
                {cards.map((card) => {
                    const status = getStatus(card.id);

                    return (
                        <div className="col-6 col-md-3 mb-4" key={card.id}>
                            <div className="card h-100 shadow-sm rounded-4 overflow-hidden">
                                <img
                                    src={card.images.small}
                                    className="card-img-top p-2"
                                />

                                <div className="card-body">
                                    <h6>{card.name}</h6>

                                    <div className="d-grid gap-2">

                                        <button className="btn btn-sm btn-emerald">
                                            Lo tengo
                                        </button>

                                        <button className="btn btn-sm btn-outline-warning">
                                            Lo busco
                                        </button>

                                        <button className="btn btn-sm btn-outline-danger">
                                            Lo vendo
                                        </button>

                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}