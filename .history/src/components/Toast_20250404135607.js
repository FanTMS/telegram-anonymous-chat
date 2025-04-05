import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const Toast = ({ message, duration = 3000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => {
                if (onClose) onClose();
            }, 300); // Даем время для анимации исчезновения
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return ReactDOM.createPortal(
        <div className={`toast-notification ${visible ? 'visible' : 'hidden'}`}>
            {message}
        </div>,
        document.body
    );
};

// Компонент для управления множественными тостами
const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    // Функция для добавления нового тоста
    const showToast = (message, duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, duration }]);
        return id;
    };

    // Функция для удаления тоста
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
