import WebApp from '@twa-dev/sdk';

/**
 * Утилиты для работы с видимой областью в Telegram Mini-App
 * для корректного отображения элементов с учетом безопасных зон
 */
export const safeViewport = {
    /**
     * Получает реальную высоту видимой области с учетом безопасных зон
     */
    getViewportHeight(): number {
        try {
            // Для Telegram WebApp
            if (typeof WebApp !== 'undefined' && WebApp.viewportHeight) {
                return WebApp.viewportHeight;
            }

            // Для обычного браузера
            return window.innerHeight;
        } catch (e) {
            console.warn('Ошибка при получении высоты области просмотра:', e);
            return window.innerHeight;
        }
    },

    /**
     * Получает стиль CSS для учета безопасной зоны внизу
     */
    getSafeAreaBottomStyle(): string {
        try {
            return 'env(safe-area-inset-bottom, 0px)';
        } catch (e) {
            return '0px';
        }
    },

    /**
     * Применяет CSS переменные для безопасных областей
     */
    applySafeAreaVariables(): void {
        try {
            document.documentElement.style.setProperty(
                '--safe-area-inset-top',
                'env(safe-area-inset-top, 0px)'
            );
            document.documentElement.style.setProperty(
                '--safe-area-inset-bottom',
                'env(safe-area-inset-bottom, 0px)'
            );
            document.documentElement.style.setProperty(
                '--safe-area-inset-left',
                'env(safe-area-inset-left, 0px)'
            );
            document.documentElement.style.setProperty(
                '--safe-area-inset-right',
                'env(safe-area-inset-right, 0px)'
            );
        } catch (e) {
            console.warn('Ошибка при установке CSS переменных для безопасных зон:', e);
        }
    },

    /**
     * Получает высоту нижней навигационной панели с учетом безопасных зон
     */
    getNavbarHeight(): number {
        try {
            const baseHeight = 56; // Базовая высота навбара
            const safeAreaBottom = parseInt(getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-bottom')
                .replace('px', '')) || 0;

            return baseHeight + safeAreaBottom;
        } catch (e) {
            console.warn('Ошибка при расчете высоты навбара:', e);
            return 56; // Возвращаем базовую высоту по умолчанию
        }
    },

    /**
     * Устанавливает CSS переменные для корректной работы в Telegram Mini-App
     */
    setupViewport(): void {
        // Применяем переменные безопасных зон
        this.applySafeAreaVariables();

        // Устанавливаем высоту видимой области
        const height = this.getViewportHeight();
        document.documentElement.style.setProperty('--app-height', `${height}px`);

        // Устанавливаем высоту нижней панели
        const navbarHeight = this.getNavbarHeight();
        document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);

        console.log(`Установлены переменные для области просмотра: высота=${height}px, навбар=${navbarHeight}px`);
    }
};

/**
 * Инициализируем обработку изменения размера окна для динамического обновления переменных
 */
export const initSafeViewport = (): void => {
    try {
        // Первоначальная настройка
        safeViewport.setupViewport();

        // Обновление при изменении размеров окна
        window.addEventListener('resize', () => {
            safeViewport.setupViewport();
        });

        // Для мобильных устройств также слушаем изменение ориентации
        window.addEventListener('orientationchange', () => {
            // Небольшая задержка для корректной обработки изменения ориентации
            setTimeout(() => {
                safeViewport.setupViewport();
            }, 100);
        });

        console.log('Инициализирован модуль safeViewport');
    } catch (e) {
        console.error('Ошибка при инициализации safeViewport:', e);
    }
};

export default safeViewport;
