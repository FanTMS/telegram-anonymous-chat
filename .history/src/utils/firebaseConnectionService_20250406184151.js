import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Сервис для проверки и восстановления соединения с Firebase
 */
class FirebaseConnectionService {
    constructor() {
        this.isConnected = false;
        this.listeners = [];
        this.retryTimeout = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 3000; // 3 секунды
        this.lastConnected = null;
        this.connectionTestDocPath = "system/connection_test";
    }

    /**
     * Проверяет соединение с Firebase
     * @returns {Promise<boolean>} Результат проверки
     */
    async checkConnection() {
        try {
            // Проверка сети
            if (!navigator.onLine) {
                this._setConnectionStatus(false, "Отсутствует соединение с интернетом");
                return false;
            }

            // Пробуем получить тестовый документ из базы данных
            const testRef = doc(db, this.connectionTestDocPath);
            await getDoc(testRef);

            // Обновляем тестовый документ
            await setDoc(testRef, {
                lastCheck: serverTimestamp(),
                clientTime: new Date().toISOString(),
                userAgent: navigator.userAgent
            });

            this._setConnectionStatus(true);
            this.retryCount = 0;
            this.lastConnected = new Date();
            return true;
        } catch (error) {
            console.error("Ошибка при проверке соединения с Firebase:", error);
            this._setConnectionStatus(false, error.message);
            return false;
        }
    }

    /**
     * Запускает проверку соединения с автоматическими повторными попытками
     */
    async startConnectionCheck() {
        this.stopConnectionCheck(); // Сначала останавливаем предыдущие проверки

        try {
            const connected = await this.checkConnection();

            if (!connected && this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Повторная попытка соединения (${this.retryCount}/${this.maxRetries}) через ${this.retryDelay / 1000} сек...`);

                this.retryTimeout = setTimeout(() => {
                    this.startConnectionCheck();
                }, this.retryDelay);
            } else if (!connected) {
                console.error("Достигнуто максимальное количество попыток подключения");
                this._notifyListeners({
                    connected: false,
                    error: "Не удалось восстановить соединение после нескольких попыток",
                    maxRetriesReached: true
                });
            }
        } catch (error) {
            console.error("Ошибка при проверке соединения:", error);
        }
    }

    /**
     * Останавливает проверку соединения
     */
    stopConnectionCheck() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }
    }

    /**
     * Добавляет обработчик изменения статуса соединения
     * @param {Function} listener Функция-обработчик
     */
    addConnectionListener(listener) {
        if (typeof listener === 'function' && !this.listeners.includes(listener)) {
            this.listeners.push(listener);

            // Сразу оповещаем о текущем состоянии
            listener({
                connected: this.isConnected,
                lastConnected: this.lastConnected
            });
        }
    }

    /**
     * Удаляет обработчик изменения статуса соединения
     * @param {Function} listener Функция-обработчик для удаления
     */
    removeConnectionListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Устанавливает статус соединения и оповещает слушателей
     * @param {boolean} connected Статус соединения
     * @param {string} errorMessage Сообщение об ошибке (если есть)
     * @private
     */
    _setConnectionStatus(connected, errorMessage = null) {
        const statusChanged = this.isConnected !== connected;
        this.isConnected = connected;

        if (connected) {
            this.lastConnected = new Date();
        }

        if (statusChanged || errorMessage) {
            this._notifyListeners({
                connected,
                error: errorMessage,
                lastConnected: this.lastConnected
            });
        }
    }

    /**
     * Оповещает всех слушателей об изменении статуса соединения
     * @param {Object} status Статус соединения
     * @private
     */
    _notifyListeners(status) {
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error("Ошибка в обработчике соединения:", error);
            }
        });
    }
}

// Создаем и экспортируем синглтон
const connectionService = new FirebaseConnectionService();
export default connectionService;
