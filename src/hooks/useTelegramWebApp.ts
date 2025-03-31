import { useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { isTelegramWebAppAvailable } from '../utils/globals';

/**
 * Тип опций для хука useTelegramWebApp
 */
interface UseTelegramWebAppOptions {
    disableReady?: boolean; // Не вызывать WebApp.ready() автоматически
    mainButtonText?: string; // Текст для главной кнопки
    useBackButton?: boolean; // Использовать кнопку "назад"
    expandApp?: boolean;     // Расширить приложение на весь экран
    enableHapticFeedback?: boolean; // Включить тактильную обратную связь
}

/**
 * Хук для безопасного использования Telegram WebApp API
 */
export function useTelegramWebApp(options: UseTelegramWebAppOptions = {}) {
    const {
        disableReady = false,
        mainButtonText,
        useBackButton = false,
        expandApp = true,
        enableHapticFeedback = true
    } = options;

    const [isAvailable, setIsAvailable] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [colorScheme, setColorScheme] = useState<'light' | 'dark' | undefined>(undefined);
    const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
    const [viewportStableHeight, setViewportStableHeight] = useState<number | undefined>(undefined);
    const [themeParams, setThemeParams] = useState<Record<string, any> | undefined>(undefined);

    // Проверка доступности Telegram WebApp
    const checkAvailability = useCallback((): boolean => {
        try {
            const available = isTelegramWebAppAvailable();
            setIsAvailable(available);
            return available;
        } catch (e) {
            console.error('Ошибка при проверке доступности Telegram WebApp:', e);
            setIsAvailable(false);
            return false;
        }
    }, []);

    // Безопасное выполнение методов WebApp
    const safeExec = useCallback(<T,>(fn: () => T, defaultValue: T): T => {
        try {
            if (!isAvailable) return defaultValue;
            return fn();
        } catch (e) {
            console.error('Ошибка при вызове метода Telegram WebApp:', e);
            return defaultValue;
        }
    }, [isAvailable]);

    // Обновление состояния темы
    const updateTheme = useCallback(() => {
        if (!isAvailable) return;

        safeExec(() => {
            setColorScheme(WebApp.colorScheme);
            setThemeParams(WebApp.themeParams);

            // Применяем тему к документу
            document.documentElement.setAttribute('data-theme', WebApp.colorScheme || 'light');

            return true;
        }, false);
    }, [isAvailable, safeExec]);

    // Обновление информации о высоте viewport
    const updateViewportInfo = useCallback(() => {
        if (!isAvailable) return;

        safeExec(() => {
            setViewportHeight(WebApp.viewportHeight);
            setViewportStableHeight(WebApp.viewportStableHeight);
            return true;
        }, false);
    }, [isAvailable, safeExec]);

    // Инициализация при монтировании компонента
    useEffect(() => {
        // Проверяем доступность WebApp
        const available = checkAvailability();
        if (!available) return;

        // Вызываем WebApp.ready() если не отключено
        if (!disableReady && !isReady) {
            safeExec(() => {
                WebApp.ready();
                setIsReady(true);
                console.log('WebApp.ready() вызван из хука useTelegramWebApp');
                return true;
            }, false);
        }

        // Расширяем приложение если нужно
        if (expandApp) {
            safeExec(() => {
                WebApp.expand();
                return true;
            }, false);
        }

        // Обновляем данные о теме и viewport
        updateTheme();
        updateViewportInfo();

        // Добавляем слушатели событий
        const themeChangeHandler = () => updateTheme();
        const viewportChangeHandler = () => updateViewportInfo();

        safeExec(() => {
            WebApp.onEvent('themeChanged', themeChangeHandler);
            WebApp.onEvent('viewportChanged', viewportChangeHandler);
            return true;
        }, false);

        // Очистка при размонтировании
        return () => {
            safeExec(() => {
                WebApp.offEvent('themeChanged', themeChangeHandler);
                WebApp.offEvent('viewportChanged', viewportChangeHandler);
                return true;
            }, false);
        };
    }, [checkAvailability, disableReady, expandApp, isReady, safeExec, updateTheme, updateViewportInfo]);

    // Эффект для настройки кнопки назад
    useEffect(() => {
        if (!isAvailable || !useBackButton) return;

        const handleBackClick = () => {
            window.history.back();
        };

        safeExec(() => {
            WebApp.BackButton.show();
            WebApp.BackButton.onClick(handleBackClick);
            return true;
        }, false);

        return () => {
            safeExec(() => {
                WebApp.BackButton.offClick(handleBackClick);
                WebApp.BackButton.hide();
                return true;
            }, false);
        };
    }, [isAvailable, safeExec, useBackButton]);

    // Эффект для настройки основной кнопки
    useEffect(() => {
        if (!isAvailable || !mainButtonText) return;

        safeExec(() => {
            WebApp.MainButton.setText(mainButtonText);
            WebApp.MainButton.show();
            return true;
        }, false);

        return () => {
            safeExec(() => {
                WebApp.MainButton.hide();
                return true;
            }, false);
        };
    }, [isAvailable, mainButtonText, safeExec]);

    // Вспомогательные функции для haptic feedback
    const hapticFeedback = {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
            if (!isAvailable || !enableHapticFeedback) return;
            safeExec(() => {
                WebApp.HapticFeedback.impactOccurred(style);
                return true;
            }, false);
        },
        notificationOccurred: (type: 'error' | 'success' | 'warning') => {
            if (!isAvailable || !enableHapticFeedback) return;
            safeExec(() => {
                WebApp.HapticFeedback.notificationOccurred(type);
                return true;
            }, false);
        },
        selectionChanged: () => {
            if (!isAvailable || !enableHapticFeedback) return;
            safeExec(() => {
                WebApp.HapticFeedback.selectionChanged();
                return true;
            }, false);
        },
        tap: () => {
            if (!isAvailable || !enableHapticFeedback) return;
            safeExec(() => {
                try {
                    WebApp.HapticFeedback.impactOccurred('light');
                } catch (e) {
                    // Если impactOccurred недоступен, пробуем другие методы
                    try {
                        WebApp.HapticFeedback.selectionChanged();
                    } catch (e2) {
                        // Игнорируем, если haptic недоступен
                    }
                }
                return true;
            }, false);
        }
    };

    // Функция для управления главной кнопкой
    const mainButton = {
        setText: (text: string) => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.MainButton.setText(text);
                if (!WebApp.MainButton.isVisible) {
                    WebApp.MainButton.show();
                }
                return true;
            }, false);
        },
        show: () => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.MainButton.show();
                return true;
            }, false);
        },
        hide: () => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.MainButton.hide();
                return true;
            }, false);
        },
        setLoading: (loading: boolean) => {
            if (!isAvailable) return;
            safeExec(() => {
                if (loading) {
                    WebApp.MainButton.showProgress(false);
                } else {
                    WebApp.MainButton.hideProgress();
                }
                return true;
            }, false);
        },
        onClick: (handler: () => void) => {
            if (!isAvailable) return () => { };

            const wrappedHandler = () => {
                if (enableHapticFeedback) {
                    hapticFeedback.tap();
                }
                handler();
            };

            safeExec(() => {
                WebApp.MainButton.onClick(wrappedHandler);
                return true;
            }, false);

            // Возвращаем функцию удаления обработчика
            return () => {
                safeExec(() => {
                    WebApp.MainButton.offClick(wrappedHandler);
                    return true;
                }, false);
            };
        },
        setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.MainButton.setParams(params);
                return true;
            }, false);
        }
    };

    // Возвращаем API для использования в компонентах
    return {
        isAvailable,
        isReady,
        colorScheme,
        viewportHeight,
        viewportStableHeight,
        themeParams,
        hapticFeedback,
        mainButton,
        close: () => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.close();
                return true;
            }, false);
        },
        showAlert: (message: string): Promise<void> => {
            return new Promise((resolve) => {
                if (isAvailable) {
                    safeExec(() => {
                        WebApp.showAlert(message, () => resolve());
                        return true;
                    }, false);
                } else {
                    alert(message);
                    resolve();
                }
            });
        },
        showConfirm: (message: string): Promise<boolean> => {
            return new Promise((resolve) => {
                if (isAvailable) {
                    safeExec(() => {
                        WebApp.showConfirm(message, (confirmed) => resolve(confirmed));
                        return true;
                    }, false);
                } else {
                    const confirmed = window.confirm(message);
                    resolve(confirmed);
                }
            });
        },
        openLink: (url: string) => {
            if (!isAvailable) {
                window.open(url, '_blank');
                return;
            }
            safeExec(() => {
                WebApp.openLink(url);
                return true;
            }, false);
        },
        expand: () => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.expand();
                return true;
            }, false);
        },
        setBackgroundColor: (color: "bg_color" | "secondary_bg_color" | `#${string}`) => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.setBackgroundColor(color);
                return true;
            }, false);
        },
        setHeaderColor: (color: 'bg_color' | 'secondary_bg_color') => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.setHeaderColor(color);
                return true;
            }, false);
        },
        enableClosingConfirmation: () => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.enableClosingConfirmation();
                return true;
            }, false);
        },
        disableClosingConfirmation: () => {
            if (!isAvailable) return;
            safeExec(() => {
                WebApp.disableClosingConfirmation();
                return true;
            }, false);
        }
    };
}

export default useTelegramWebApp;
