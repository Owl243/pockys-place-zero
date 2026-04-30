import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="toast-container position-fixed bottom-0 start-50 translate-middle-x mb-4 pb-5 pb-lg-2" style={{ zIndex: 9999 }}>
                {toasts.map(toast => (
                    <div 
                        key={toast.id} 
                        className={`toast-item show mb-2 px-4 py-3 rounded-pill shadow-lg border border-white border-opacity-10 backdrop-blur-md d-flex align-items-center gap-2 animate-fade-up ${
                            toast.type === 'success' ? 'bg-emerald' : toast.type === 'error' ? 'bg-danger' : 'bg-pink'
                        }`}
                        style={{ 
                            backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : toast.type === 'pink' ? 'rgba(255, 75, 145, 0.9)' : 'rgba(220, 53, 69, 0.9)',
                            color: 'white',
                            minWidth: '280px'
                        }}
                    >
                        <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}`}></i>
                        <span className="fw-bold small">{toast.message}</span>
                    </div>
                ))}
            </div>
            <style>{`
                .animate-fade-up {
                    animation: fadeUp 0.3s ease-out forwards;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .bg-pink { background-color: #ff4b91; }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
