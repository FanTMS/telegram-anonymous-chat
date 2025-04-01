/**
 * Конфигурация и безопасная инициализация Telegram WebApp
 */
import { isBrowser } from '../utils/browserUtils';

// Создаем заглушку WebApp для сред без поддержки реального WebApp
const WebAppStub = {
  MainButton: {
    setText: () => {},
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {}
  },
  isSupported: false,
  ready: () => {}
};

// Пытаемся импортировать реальный WebApp только в браузерной среде
let WebAppInstance = WebAppStub;

// Безопасная инициализация WebApp
if (isBrowser()) {
  try {
    const TelegramWebApp = require('@twa-dev/sdk');
    WebAppInstance = TelegramWebApp.default || TelegramWebApp;
    WebAppInstance.isSupported = true;
  } catch (e) {
    console.warn('Не удалось инициализировать Telegram WebApp:', e);
  }
}

export default WebAppInstance;
