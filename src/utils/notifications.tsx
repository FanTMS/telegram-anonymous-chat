import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Toast } from '../components/Toast';
import WebApp from '@twa-dev/sdk';

// Тип для уведомления
interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

// Контекст для провайдера уведомлений
interface NotificationContextType {
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
}

// Создаем контекст с значениями по умолчанию
const NotificationContext = createContext<NotificationContextType>({
    showSuccess: () => { },
    showError: () => { },
    showInfo: () => { },
    showWarning: () => { },
});

// Провайдер уведомлений
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Функция для добавления нового уведомления
    const addNotification = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string, duration: number = 3000) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Добавляем в список
        setNotifications(prev => [...prev, { id, message, type, duration }]);

        // Добавляем виброотклик для Telegram WebApp
        try {
            if (WebApp && WebApp.HapticFeedback) {
                switch (type) {
                    case 'success':
                        WebApp.HapticFeedback.notificationOccurred('success');
                        break;
                    case 'error':
                        WebApp.HapticFeedback.notificationOccurred('error');
                        break;
                    case 'warning':
                        WebApp.HapticFeedback.notificationOccurred('warning');
                        break;
                    case 'info':
                    default:
                        WebApp.HapticFeedback.impactOccurred('medium');
                        break;
                }
            }
        } catch (e) {
            console.warn('Ошибка при вызове HapticFeedback:', e);
        }
    }, []);

    // Функции для разных типов уведомлений
    const showSuccess = useCallback((message: string, duration?: number) => {
        addNotification('success', message, duration);
    }, [addNotification]);

    const showError = useCallback((message: string, duration?: number) => {
        addNotification('error', message, duration);
    }, [addNotification]);

    const showInfo = useCallback((message: string, duration?: number) => {
        addNotification('info', message, duration);
    }, [addNotification]);

    const showWarning = useCallback((message: string, duration?: number) => {
        addNotification('warning', message, duration);
    }, [addNotification]);

    // Обработчик закрытия уведомления
    const handleClose = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
            {children}

            {/* Рендерим список уведомлений */}
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    onClose={() => handleClose(notification.id)}
                    position="bottom"
                />
            ))}
        </NotificationContext.Provider>
    );
};

// Хук для использования уведомлений в компонентах
export const useNotifications = () => {
    return useContext(NotificationContext);
};

// Отдельный сервис для использования уведомлений вне компонентов React
export const useNotificationService = () => {
    const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        try {
            // Показываем уведомление в Telegram WebApp если возможно
            if (typeof WebApp !== 'undefined') {
                if (type === 'error') {
                    WebApp.showPopup({
                        title: 'Ошибка',
                        message,
                        buttons: [{ type: 'ok' }]
                    });
                } else if (type === 'success') {
                    WebApp.showPopup({
                        title: 'Успех',
                        message,
                        buttons: [{ type: 'ok' }]
                    });
                } else {
                    WebApp.showAlert(message);
                }

                // Добавляем виброотклик в зависимости от типа
                try {
                    if (WebApp.HapticFeedback) {
                        switch (type) {
                            case 'success':
                                WebApp.HapticFeedback.notificationOccurred('success');
                                break;
                            case 'error':
                                WebApp.HapticFeedback.notificationOccurred('error');
                                break;
                            case 'warning':
                                WebApp.HapticFeedback.notificationOccurred('warning');
                                break;
                            case 'info':
                            default:
                                WebApp.HapticFeedback.impactOccurred('medium');
                                break;
                        }
                    }
                } catch (e) {
                    console.warn('Ошибка при вызове HapticFeedback:', e);
                }
            } else {
                // Если WebApp недоступен, используем стандартный alert
                alert(message);
            }
        } catch (e) {
            console.error('Ошибка при показе уведомления:', e);
            // В случае ошибки пытаемся показать обычный alert
            try {
                alert(message);
            } catch {
                console.error('Не удалось показать ни один тип уведомлений');
            }
        }
    };

    return {
        showSuccess: (message: string) => showToast(message, 'success'),
        showError: (message: string) => showToast(message, 'error'),
        showInfo: (message: string) => showToast(message, 'info'),
        showWarning: (message: string) => showToast(message, 'warning')
    };
};
