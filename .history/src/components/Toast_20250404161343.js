import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/Toast.css';

const Toast = ({ message, type = 'error', visible, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration, onClose]);

    if (!visible) return null;

    return (
        <div className={`toast ${type}`}>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
};

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'error', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return {
        ToastContainer: () => (
            <>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        visible={true}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </>
        ),
        showToast
    };
};

export default ToastContainer;
