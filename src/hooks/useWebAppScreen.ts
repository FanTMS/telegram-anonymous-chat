import { useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';

/**
 * Хук для получения и отслеживания размеров экрана в Telegram WebApp
 */
export function useWebAppScreen() {
    // Состояния для хранения параметров экрана
    const [viewportHeight, setViewportHeight] = useState<number>(0);
    const [viewportStableHeight, setViewportStableHeight] = useState<number>(0);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const [isAvailable, setIsAvailable] = useState<boolean>(false);

    /**
     * Получение параметров экрана из WebApp
     */
    const updateScreenParams = useCallback(() => {
        try {
            const available = typeof WebApp !== 'undefined';
            setIsAvailable(available);

            if (available) {
                setViewportHeight(WebApp.viewportHeight || window.innerHeight);
                setViewportStableHeight(WebApp.viewportStableHeight || window.innerHeight);
                setIsExpanded(WebApp.isExpanded || false);
                setHeaderHeight(WebApp.headerColor ? 56 : 0); // Примерная высота заголовка
            } else {
                // Если WebApp недоступен, используем размеры окна
                setViewportHeight(window.innerHeight);
                setViewportStableHeight(window.innerHeight);
                setIsExpanded(false);
                setHeaderHeight(0);
            }
        } catch (error) {
            console.error('Ошибка при получении параметров экрана:', error);
            setViewportHeight(window.innerHeight);
            setViewportStableHeight(window.innerHeight);
            setIsExpanded(false);
            setHeaderHeight(0);
            setIsAvailable(false);
        }
    }, []);

    /**
     * Обработчик изменения размеров экрана
     */
    useEffect(() => {
        // Первичное обновление параметров
        updateScreenParams();

        // Слушатель изменения размеров экрана
        const handleResize = () => {
            updateScreenParams();
        };

        // Добавляем слушатели
        window.addEventListener('resize', handleResize);
        if (typeof WebApp !== 'undefined' && WebApp.onEvent) {
            try {
                WebApp.onEvent('viewportChanged', handleResize);
            } catch (e) {
                console.warn('Не удалось добавить обработчик viewportChanged:', e);
            }
        }

        // Очистка при размонтировании
        return () => {
            window.removeEventListener('resize', handleResize);
            if (typeof WebApp !== 'undefined' && WebApp.offEvent) {
                try {
                    WebApp.offEvent('viewportChanged', handleResize);
                } catch (e) {
                    console.warn('Не удалось удалить обработчик viewportChanged:', e);
                }
            }
        };
    }, [updateScreenParams]);

    // Расчетное свободное пространство контента
    const contentHeight = viewportHeight - headerHeight;
    const contentStableHeight = viewportStableHeight - headerHeight;

    // Возвращаем параметры и методы
    return {
        viewportHeight,
        viewportStableHeight,
        contentHeight,
        contentStableHeight,
        isExpanded,
        headerHeight,
        isAvailable,
        updateScreenParams
    };
}

export default useWebAppScreen;
