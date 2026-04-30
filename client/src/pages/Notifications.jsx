import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { listenNotifications } from "../services/notificationService";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsub = listenNotifications(user.uid, setNotifications);

        return () => unsub();
    }, []);

    return (
        <div className="container">
            <h2>Notificaciones</h2>

            {notifications.map((n) => (
                <div key={n.id} className="card p-3 mb-2">
                    🔔 {n.message}
                </div>
            ))}
        </div>
    );
}