import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

interface UseBackNavigationOptions {
    /**
     * Путь для навигации при нажатии "назад"
     * Если не указан, будет использоваться navigate(-1)
     */
    backPath?: string;

    /**
     * Использовать ли кнопку Telegram BackButton
     */
    useTelegramBackButton?: boolean;

    /**
     * Колбэк, вызываемый при нажатии "назад"
     * Если возвращает true, стандартная навигация не будет выполнена
     */
    onBack?: () => boolean | void;

    /**
     * Колбэк, вызываемый до навигации назад
     * Например, для сохранения данных
     */
    beforeBack?: () => void | Promise<void>;

    /**
     * Показать кнопку назад только в том случае, если у истории есть записи
     */
    showOnlyWithHistory?: boolean;
}

/**
 * Хук для управления навигацией назад с интеграцией с Telegram WebApp
 */
export function useBackNavigation({
    backPath,
    useTelegramBackButton = true,
    onBack,
    beforeBack,
    showOnlyWithHistory = false
}: UseBackNavigationOptions = {}) {
    const navigate = useNavigate();

    // Обработчик навигации назад
    const handleBack = useCallback(async () => {
        try {
            // Выполняем пользовательскую логику перед навигацией назад
            if (beforeBack) {
                await beforeBack();
            }

            // Вызываем пользовательский колбэк и проверяем его результат
            if (onBack && onBack() === true) {
                return; // Пользовательский колбэк обработал навигацию
            }

            // Выполняем навигацию назад
            if (backPath) {
                navigate(backPath);
            } else {
                navigate(-1);
            }
        } catch (error) {
            console.error('Ошибка при навигации назад:', error);
        }
    }, [navigate, backPath, onBack, beforeBack]);

    // Настройка интеграции с Telegram WebApp
    useEffect(() => {
        try {
            // Проверяем, доступен ли Telegram WebApp API
            const isTelegramWebAppAvailable =
                typeof WebApp !== 'undefined' &&
                WebApp.isExpanded &&
                WebApp.BackButton;

            // Проверяем, нужно ли показывать кнопку назад
            const shouldShowBackButton = !showOnlyWithHistory || window.history.length > 1;

            if (isTelegramWebAppAvailable && useTelegramBackButton && shouldShowBackButton) {
                WebApp.BackButton.onClick(handleBack);
                WebApp.BackButton.show();

                return () => {
                    WebApp.BackButton.offClick(handleBack);
                    WebApp.BackButton.hide();
                };
            }
        } catch (error) {
            console.error('Ошибка при настройке Telegram BackButton:', error);
        }
    }, [handleBack, useTelegramBackButton, showOnlyWithHistory]);

    // Возвращаем обработчик для использования в пользовательских кнопках
    return { goBack: handleBack };
}

export default useBackNavigation;
