import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getInventory } from "../services/inventoryService";

export default function Wishlist() {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const data = await getInventory(user.uid);
            setCards(data.filter(c => c.inWishlist));
        };

        load();
    }, []);

    return (
        <div>
            <h2>Wishlist</h2>

            <div className="row">
                {cards.map((card) => (
                    <div className="col-6 col-md-3 mb-4" key={card.id}>
                        <div className="card">
                            <img src={card.image} className="card-img-top" />
                            <div className="card-body">
                                <h6>{card.name}</h6>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}