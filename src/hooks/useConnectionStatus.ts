import { useState, useEffect } from 'react';

interface ConnectionStatus {
    online: boolean;
    backOnline: boolean;
    wasOffline: boolean;
    since: number | null;
    lastCheck: number;
}

/**
 * Хук для отслеживания состояния сетевого подключения
 */
export function useConnectionStatus() {
    const [status, setStatus] = useState<ConnectionStatus>({
        online: navigator.onLine,
        backOnline: false,
        wasOffline: false,
        since: null,
        lastCheck: Date.now()
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        // Обработчик для события перехода в онлайн
        const handleOnline = () => {
            setStatus(prev => ({
                online: true,
                backOnline: prev.wasOffline, // Показываем уведомление только если раньше было оффлайн
                wasOffline: prev.wasOffline,
                since: prev.since,
                lastCheck: Date.now()
            }));

            // Сбрасываем флаг backOnline через 5 секунд
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setStatus(prev => ({
                    ...prev,
                    backOnline: false
                }));
            }, 5000);
        };

        // Обработчик для события перехода в оффлайн
        const handleOffline = () => {
            setStatus(prev => ({
                online: false,
                backOnline: false,
                wasOffline: true,
                since: prev.since || Date.now(), // Сохраняем время перехода в оффлайн
                lastCheck: Date.now()
            }));
        };

        // Добавляем слушатели событий
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Функция для проверки соединения с сервером
        const checkServerConnection = async () => {
            try {
                // Пытаемся получить маленький файл или ping сервера
                const result = await fetch('/api/ping?_=' + Date.now(), {
                    method: 'HEAD',
                    cache: 'no-cache'
                });

                const isServerReachable = result.ok;

                setStatus(prev => ({
                    ...prev,
                    online: isServerReachable,
                    backOnline: !prev.online && isServerReachable,
                    wasOffline: prev.wasOffline || !isServerReachable,
                    lastCheck: Date.now()
                }));
            } catch (error) {
                // Если ошибка - значит сервер недоступен
                setStatus(prev => ({
                    ...prev,
                    online: false,
                    backOnline: false,
                    wasOffline: true,
                    lastCheck: Date.now()
                }));
            }
        };

        // Запускаем периодическую проверку соединения
        const checkInterval = setInterval(checkServerConnection, 30000);

        // Очистка при размонтировании
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(checkInterval);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    return status;
}

export default useConnectionStatus;
