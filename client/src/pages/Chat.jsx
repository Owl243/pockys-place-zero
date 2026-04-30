import { useState, useEffect } from "react";
import { getChats, addMessage } from "../utils/storage";

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    useEffect(() => {
        setMessages(getChats());
    }, []);

    const send = () => {
        if (!text.trim()) return;

        addMessage("General", text);
        setMessages(getChats());
        setText("");
    };

    return (
        <div>
            <h2>Chats</h2>

            <div className="border p-3 mb-3" style={{ height: "300px", overflowY: "auto" }}>
                {messages.map((msg, i) => (
                    <div key={i}>
                        💬 {msg.message}
                    </div>
                ))}
            </div>

            <div className="input-group">
                <input
                    className="form-control"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button className="btn btn-primary" onClick={send}>
                    Enviar
                </button>
            </div>
        </div>
    );
}