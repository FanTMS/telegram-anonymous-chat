import React, { useEffect, useState, createContext, useContext } from 'react';
import '../styles/Toast.css';

// Компонент для отображения одного уведомления
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

// Создаем контекст для работы с тостами
const ToastContext = createContext(null);

// Хук для использования тостов в компонентах
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Провайдер контекста тостов
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'error', duration = 3000) => {
        // Используем комбинацию Date.now() и случайной строки для уникальности ID
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setToasts(prev => [...prev, { id, message, type, duration, visible: true }]);
        return id;
    };

    const closeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        visible={toast.visible}
                        duration={toast.duration}
                        onClose={() => closeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default Toast;
