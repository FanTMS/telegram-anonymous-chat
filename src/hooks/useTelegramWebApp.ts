import { useEffect, useState, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { hapticFeedback } from '../utils/hapticFeedback';

/**
 * Интерфейс настроек для хука
 */
interface UseTelegramWebAppOptions {
    /**
     * Отключить автоматический вызов WebApp.ready()
     */
    disableReady?: boolean;

    /**
     * Инициализировать MainButton с текстом
     */
    mainButtonText?: string;

    /**
     * Автоматически скрывать/показывать BackButton при смене маршрута
     */
    useBackButton?: boolean;

    /**
     * Путь для навигации назад
     */
    backPath?: string;
}

/**
 * Хук для интеграции с Telegram WebApp
 */
export function useTelegramWebApp({
    disableReady = false,
    mainButtonText,
    useBackButton = false,
    backPath
}: UseTelegramWebAppOptions = {}) {
    // Состояние доступности API
    const [isAvailable, setIsAvailable] = useState<boolean>(false);
    // Разрешение для использования MainButton
    const [canUseMainButton, setCanUseMainButton] = useState<boolean>(false);
    // Текущий статус сообщения от MainButton
    const [mainButtonLoading, setMainButtonLoading] = useState<boolean>(false);

    /**
     * Проверка доступности WebApp API
     */
    const checkAvailability = useCallback(() => {
        try {
            const available = typeof WebApp !== 'undefined' && !!WebApp.isExpanded;
            setIsAvailable(available);
            return available;
        } catch (e) {
            console.error('Ошибка при проверке доступности Telegram WebApp:', e);
            setIsAvailable(false);
            return false;
        }
    }, []);

    /**
     * Безопасный вызов методов WebApp
     */
    const safeExec = useCallback(<T,>(fn: () => T, fallback: T): T => {
        try {
            if (!isAvailable) return fallback;
            return fn();
        } catch (e) {
            console.error('Ошибка при вызове метода Telegram WebApp:', e);
            return fallback;
        }
    }, [isAvailable]);

    /**
     * Установка текста для MainButton
     */
    const setMainButtonText = useCallback((text: string) => {
        safeExec(() => {
            WebApp.MainButton.setText(text);
            if (!WebApp.MainButton.isVisible) {
                WebApp.MainButton.show();
            }
            setCanUseMainButton(true);
            return true;
        }, false);
    }, [safeExec]);

    /**
     * Установка MainButton в состояние загрузки
     */
    const setMainButtonProgress = useCallback((loading: boolean) => {
        if (!canUseMainButton) return;

        safeExec(() => {
            if (loading) {
                WebApp.MainButton.showProgress(false);
            } else {
                WebApp.MainButton.hideProgress();
            }
            setMainButtonLoading(loading);
            return true;
        }, false);
    }, [canUseMainButton, safeExec]);

    /**
     * Сброс MainButton в исходное состояние
     */
    const resetMainButton = useCallback(() => {
        if (!canUseMainButton) return;

        safeExec(() => {
            WebApp.MainButton.hide();
            WebApp.MainButton.hideProgress();
            // We can't directly remove all handlers this way
            // We need to track and remove specific handlers individually
            setMainButtonLoading(false);
            setCanUseMainButton(false);
            return true;
        }, false);
    }, [canUseMainButton, safeExec]);

    /**
     * Установка обработчика нажатия на MainButton
     */
    const setMainButtonClickHandler = useCallback((handler: () => void, enableHapticFeedback: boolean = true) => {
        if (!canUseMainButton) return () => { };

        return safeExec(() => {
            // Создаем обработчик с виброоткликом
            const wrappedHandler = () => {
                if (enableHapticFeedback) {
                    hapticFeedback.tap();
                }
                handler();
            };

            // Устанавливаем новый обработчик
            WebApp.MainButton.onClick(wrappedHandler);

            // Возвращаем функцию очистки
            return () => {
                WebApp.MainButton.offClick(wrappedHandler);
            };
        }, () => { });
    }, [canUseMainButton, safeExec]);

    /**
     * Инициализация при монтировании компонента
     */
    useEffect(() => {
        // Проверяем доступность WebApp
        const available = checkAvailability();
        if (!available) return;

        // Вызываем WebApp.ready() если не отключено
        if (!disableReady) {
            safeExec(() => {
                WebApp.ready();
                console.log('WebApp.ready() вызван из useTelegramWebApp');
                return true;
            }, false);
        }

        // Устанавливаем текст MainButton если предоставлен
        if (mainButtonText && mainButtonText.trim()) {
            setMainButtonText(mainButtonText);
        }

        // При размонтировании - очищаем ресурсы
        return () => {
            if (canUseMainButton) {
                resetMainButton();
            }
        };
    }, [checkAvailability, disableReady, mainButtonText, canUseMainButton, resetMainButton, safeExec, setMainButtonText]);

    /**
     * Возвращаем публичные методы и свойства
     */
    return {
        isAvailable,
        canUseMainButton,
        mainButtonLoading,
        setMainButtonText,
        setMainButtonProgress,
        resetMainButton,
        setMainButtonClickHandler,
        hapticFeedback
    };
}

export default useTelegramWebApp;
