import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

/**
 * Сервис для мониторинга и восстановления соединения с Firebase
 */
class FirebaseConnectionService {
  constructor() {
    this.isConnected = navigator.onLine;
    this.listeners = [];
    this.unsubscribe = null;
    this.connectionRef = doc(db, "system", "connection_status");
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryInterval = null;
    
    // Подписываемся на изменения onLine статуса
    this._setupNetworkListeners();
    
    // Инициализируем соединение
    this._setupConnectionMonitoring();
  }

  /**
   * Запускает мониторинг соединения с Firebase
   */
  _setupConnectionMonitoring() {
    try {
      // Создаем или обновляем документ статуса соединения
      setDoc(this.connectionRef, {
        lastOnline: serverTimestamp(),
        clientInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        }
      }, { merge: true })
      .then(() => {
        console.log("✅ Соединение с Firebase установлено");
        this._updateConnectionStatus(true);
      })
      .catch(error => {
        console.error("❌ Ошибка при обновлении статуса соединения:", error);
        this._updateConnectionStatus(false, error);
        this._startRetryProcess();
      });
      
      // Подписываемся на изменения документа для мониторинга
      this.unsubscribe = onSnapshot(this.connectionRef, 
        (doc) => {
          // Успешное получение обновлений означает активное соединение
          if (doc.exists()) {
            this._updateConnectionStatus(true);
          }
        },
        (error) => {
          console.error("❌ Ошибка при мониторинге соединения:", error);
          this._updateConnectionStatus(false, error);
          this._startRetryProcess();
        }
      );
    } catch (error) {
      console.error("❌ Ошибка при настройке мониторинга соединения:", error);
      this._updateConnectionStatus(false, error);
    }
  }

  /**
   * Настраивает слушатели сетевого соединения
   */
  _setupNetworkListeners() {
    // Обработчик потери соединения с сетью
    window.addEventListener('offline', () => {
      console.log("⚠️ Соединение с сетью потеряно");
      this._updateConnectionStatus(false, { message: "Отсутствует соединение с интернетом" });
    });

    // Обработчик восстановления соединения с сетью
    window.addEventListener('online', () => {
      console.log("✅ Соединение с сетью восстановлено");
      this._checkConnection();
    });
  }

  /**
   * Начинает процесс повторных попыток соединения
   */
  _startRetryProcess() {
    // Очищаем предыдущий интервал, если есть
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }

    this.retryCount = 0;
    
    // Устанавливаем интервал для повторных попыток
    this.retryInterval = setInterval(() => {
      if (this.isConnected || this.retryCount >= this.maxRetries) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
        
        if (this.retryCount >= this.maxRetries && !this.isConnected) {
          console.error(`❌ Не удалось восстановить соединение после ${this.maxRetries} попыток`);
          this._notifyListeners({
            connected: false,
            error: `Не удалось восстановить соединение после ${this.maxRetries} попыток`,
            maxRetriesReached: true
          });
        }
        return;
      }

      this.retryCount++;
      console.log(`🔄 Попытка восстановления соединения ${this.retryCount}/${this.maxRetries}`);
      this._checkConnection();
    }, 5000); // Пробуем каждые 5 секунд
  }

  /**
   * Проверяет соединение с Firebase
   * @returns {Promise<boolean>} Результат проверки
   */
  async _checkConnection() {
    if (!navigator.onLine) {
      this._updateConnectionStatus(false, { message: "Отсутствует соединение с интернетом" });
      return false;
    }

    try {
      await setDoc(this.connectionRef, {
        lastCheck: serverTimestamp(),
        timestamp: Date.now()
      }, { merge: true });
      
      this._updateConnectionStatus(true);
      return true;
    } catch (error) {
      console.error("❌ Ошибка при проверке соединения:", error);
      this._updateConnectionStatus(false, error);
      return false;
    }
  }

  /**
   * Обновляет статус соединения и уведомляет слушателей
   * @param {boolean} connected - Статус соединения
   * @param {Error|Object} [error] - Ошибка, если есть
   */
  _updateConnectionStatus(connected, error = null) {
    const statusChanged = this.isConnected !== connected;
    this.isConnected = connected;
    
    if (statusChanged || error) {
      const status = {
        connected,
        error: error ? (error.message || JSON.stringify(error)) : null,
        timestamp: Date.now()
      };
      
      this._notifyListeners(status);
    }
  }

  /**
   * Уведомляет всех слушателей об изменении статуса
   * @param {Object} status - Статус соединения
   */
  _notifyListeners(status) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (listenerError) {
        console.error("❌ Ошибка в слушателе соединения:", listenerError);
      }
    });
  }

  /**
   * Добавляет слушателя изменений статуса соединения
   * @param {Function} listener - Функция-обработчик
   */
  addConnectionListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
      
      // Сразу уведомляем о текущем статусе
      listener({
        connected: this.isConnected,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Удаляет слушателя изменений статуса соединения
   * @param {Function} listener - Функция-обработчик
   */
  removeConnectionListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Принудительно проверяет соединение с Firebase
   * @returns {Promise<boolean>} Результат проверки
   */
  async checkConnection() {
    return await this._checkConnection();
  }

  /**
   * Освобождает ресурсы при уничтожении сервиса
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    
    window.removeEventListener('online', this._checkConnection);
    window.removeEventListener('offline', this._updateConnectionStatus);
    
    this.listeners = [];
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
const connectionService = new FirebaseConnectionService();
export default connectionService;
