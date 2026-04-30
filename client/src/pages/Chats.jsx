import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { listenUserChats, listenMessages, sendMessage, isAdmin } from "../services/chatService";

export default function Chats() {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const unsub = listenUserChats(currentUser, (data) => {
            setChats(data);
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser]);

    useEffect(() => {
        if (!activeChat) return;

        const unsub = listenMessages(activeChat.id, (data) => {
            setMessages(data);
            scrollToBottom();
        });

        return () => unsub();
    }, [activeChat]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !activeChat) return;

        await sendMessage(activeChat.id, currentUser.uid, text);
        setText("");
    };

    const getOtherParticipant = (chat) => {
        const otherId = chat.participants.find(id => id !== currentUser.uid);
        // Si no hay 'otro' (es un chat del admin supervisando), mostramos info combinada
        if (!otherId && chat.participants.length > 0) {
             const firstId = chat.participants[0];
             return { id: firstId, ...chat.participantData[firstId] };
        }
        return { id: otherId, ...chat.participantData[otherId] };
    };

    const getChatTitle = (chat) => {
        if (isAdmin(currentUser)) {
            const p1 = chat.participantData[chat.participants[0]]?.name || "User 1";
            const p2 = chat.participantData[chat.participants[1]]?.name || "User 2";
            return `${p1} ↔ ${p2}`;
        }
        return getOtherParticipant(chat).name;
    };

    if (!currentUser) return <div className="text-center py-5">Por favor inicia sesión</div>;

    return (
        <div className="container py-3" style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}>
            <div className="row h-100 g-3">
                
                {/* 📱 Sidebar: Lista de Chats */}
                <div className={`col-12 col-lg-4 h-100 ${activeChat ? 'd-none d-lg-block' : 'd-block'}`}>
                    <div className="bg-dark bg-opacity-40 rounded-5 border border-white border-opacity-10 shadow-2xl h-100 d-flex flex-column backdrop-blur-xl overflow-hidden">
                        <div className="p-4 border-bottom border-white border-opacity-5">
                            <h4 className="fw-bold mb-0 text-white">Mensajes</h4>
                            <p className="text-light-muted small mb-0">Conversaciones privadas</p>
                        </div>
                        
                        <div className="overflow-auto flex-grow-1 p-2">
                            {loading ? (
                                <div className="text-center py-5"><div className="spinner-grow text-emerald" role="status"></div></div>
                            ) : chats.length === 0 ? (
                                <div className="text-center py-5 opacity-50">
                                    <i className="bi bi-chat-dots fs-1 d-block mb-2"></i>
                                    <p className="small">No tienes mensajes todavía</p>
                                </div>
                            ) : chats.map(chat => {
                                const other = getOtherParticipant(chat);
                                const isActive = activeChat?.id === chat.id;
                                return (
                                    <div 
                                        key={chat.id} 
                                        onClick={() => setActiveChat(chat)}
                                        className={`d-flex align-items-center gap-3 p-3 rounded-4 mb-2 transition-all cursor-pointer ${isActive ? 'bg-emerald bg-opacity-20 border border-emerald border-opacity-30' : 'hover-bg-white-05 border border-transparent'}`}
                                    >
                                        <div className="position-relative">
                                            <img src={getOtherParticipant(chat).photo || `https://ui-avatars.com/api/?name=${getOtherParticipant(chat).name}&background=random`} className="rounded-circle border border-white border-opacity-10" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                                            {isAdmin(currentUser) && <span className="position-absolute bottom-0 end-0 badge rounded-pill bg-danger border border-dark border-2" style={{ fontSize: '0.4rem' }}>ADMIN</span>}
                                        </div>
                                        <div className="min-w-0 flex-grow-1">
                                            <h6 className={`mb-0 fw-bold text-truncate ${isActive ? 'text-emerald' : 'text-white'}`}>{getChatTitle(chat)}</h6>
                                            <p className="mb-0 text-light-muted small text-truncate opacity-75">{chat.lastMessage}</p>
                                        </div>
                                        {chat.unread?.[currentUser.uid] && <div className="bg-emerald rounded-circle" style={{ width: '8px', height: '8px' }}></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 💬 Chat Window */}
                <div className={`col-12 col-lg-8 h-100 ${activeChat ? 'd-block' : 'd-none d-lg-flex align-items-center justify-content-center'}`}>
                    {activeChat ? (
                        <div className="bg-dark bg-opacity-30 rounded-5 border border-white border-opacity-10 shadow-2xl h-100 d-flex flex-column backdrop-blur-xl overflow-hidden">
                            
                            {/* Header */}
                            <div className="p-3 border-bottom border-white border-opacity-5 d-flex align-items-center gap-3 bg-dark bg-opacity-20">
                                <button className="btn btn-link text-white d-lg-none p-0" onClick={() => setActiveChat(null)}>
                                    <i className="bi bi-chevron-left fs-5"></i>
                                </button>
                                <img src={getOtherParticipant(activeChat).photo || `https://ui-avatars.com/api/?name=${getOtherParticipant(activeChat).name}&background=random`} className="rounded-circle border border-white border-opacity-20" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                <div>
                                    <h6 className="fw-bold mb-0 text-white">{getOtherParticipant(activeChat).name}</h6>
                                    <span className="text-emerald small" style={{ fontSize: '0.65rem' }}>● En línea ahora</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3">
                                {messages.map((msg, idx) => {
                                    const isMine = msg.senderId === currentUser.uid;
                                    return (
                                        <div key={msg.id || idx} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div className={`p-3 rounded-4 max-w-75 shadow-sm ${isMine ? 'bg-emerald bg-opacity-20 border border-emerald border-opacity-20 rounded-tr-0 text-white' : 'bg-dark bg-opacity-50 border border-white border-opacity-10 rounded-tl-0 text-white opacity-90'}`} style={{ maxWidth: '75%' }}>
                                                <p className="mb-0 small lh-sm">{msg.text}</p>
                                                <small className="text-light-muted mt-1 d-block opacity-50" style={{ fontSize: '0.6rem' }}>
                                                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 bg-dark bg-opacity-40 border-top border-white border-opacity-5">
                                <form onSubmit={handleSend} className="input-group rounded-pill overflow-hidden border border-white border-opacity-10 bg-black bg-opacity-40 p-1">
                                    <input 
                                        type="text" 
                                        className="form-control border-0 bg-transparent text-white px-4 py-2" 
                                        placeholder="Escribe un mensaje..." 
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-emerald rounded-pill px-4 ms-1 transition-all">
                                        <i className="bi bi-send-fill"></i>
                                    </button>
                                </form>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center opacity-25">
                            <i className="bi bi-chat-left-text" style={{ fontSize: '5rem' }}></i>
                            <h5 className="mt-3">Selecciona un chat para empezar</h5>
                        </div>
                    )}
                </div>

            </div>

            <style>{`
                .cursor-pointer { cursor: pointer; }
                .hover-bg-white-05:hover { background: rgba(255,255,255,0.05); }
                .rounded-tr-0 { border-top-right-radius: 4px !important; }
                .rounded-tl-0 { border-top-left-radius: 4px !important; }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}
