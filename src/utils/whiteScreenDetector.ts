/**
 * Утилита для обнаружения и исправления "белого экрана" в приложении
 */

class WhiteScreenDetector {
    private checkInterval: number = 2000; // 2 секунды
    private maxChecks: number = 5;
    private checksCount: number = 0;
    private timerId: number | null = null;
    private isRunning: boolean = false;

    /**
     * Запускает отслеживание белого экрана
     */
    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.checksCount = 0;

        this.timerId = window.setInterval(() => {
            this.checkForWhiteScreen();
        }, this.checkInterval);

        console.log('WhiteScreenDetector: запущен');
    }

    /**
     * Останавливает отслеживание белого экрана
     */
    public stop(): void {
        if (!this.isRunning || this.timerId === null) return;

        window.clearInterval(this.timerId);
        this.timerId = null;
        this.isRunning = false;

        console.log('WhiteScreenDetector: остановлен');
    }

    /**
     * Проверяет, есть ли проблема с белым экраном
     */
    private checkForWhiteScreen(): void {
        this.checksCount++;

        // Проверяем, видимы ли элементы приложения
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            console.warn('WhiteScreenDetector: элемент #root не найден!');
            this.tryToFixWhiteScreen();
            return;
        }

        const appContainer = document.getElementById('app-container');
        const visibleElements = document.querySelectorAll('#root *:not(script):not(style)');

        // Проверяем стили корневого элемента
        const rootStyle = window.getComputedStyle(rootElement);
        const isRootZeroSize =
            (rootStyle.height === '0px' || rootStyle.width === '0px') ||
            (rootStyle.display === 'none' || rootStyle.visibility === 'hidden');

        if (isRootZeroSize || visibleElements.length < 3 || !appContainer) {
            console.warn(`WhiteScreenDetector: возможен белый экран! (проверка ${this.checksCount}/${this.maxChecks})`);

            if (this.checksCount >= this.maxChecks) {
                this.tryToFixWhiteScreen();
                return;
            }
        } else {
            // Всё в порядке, останавливаем проверки
            console.log('WhiteScreenDetector: приложение отображается корректно');
            this.stop();
        }
    }

    /**
     * Пытается исправить проблему с белым экраном
     */
    private tryToFixWhiteScreen(): void {
        console.error('ВНИМАНИЕ: Обнаружен белый экран, пытаемся исправить...');

        // Останавливаем детектор
        this.stop();

        try {
            // 1. Добавляем базовые стили для #root
            const rootElement = document.getElementById('root');
            if (rootElement) {
                rootElement.style.display = 'block';
                rootElement.style.width = '100%';
                rootElement.style.height = '100%';
                rootElement.style.minHeight = '100vh';
            }

            // 2. Проверяем, есть ли контент внутри
            const hasContent = rootElement && rootElement.children.length > 0;

            if (!hasContent) {
                // 3. Если нет контента, показываем аварийное сообщение
                const errorMessage = document.createElement('div');
                errorMessage.style.padding = '20px';
                errorMessage.style.textAlign = 'center';
                errorMessage.innerHTML = `
          <h2 style="color: #e74c3c;">Проблема с отображением приложения</h2>
          <p>Произошла ошибка при загрузке интерфейса.</p>
          <button 
            style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;"
            onclick="window.location.reload()">
            Перезагрузить
          </button>
        `;

                // Если root существует, добавляем в него
                if (rootElement) {
                    rootElement.appendChild(errorMessage);
                } else {
                    // Иначе добавляем прямо в body
                    document.body.appendChild(errorMessage);
                }

                // Записываем ошибку в логи
                console.error('WhiteScreenDetector: Восстановление не удалось, отображено аварийное сообщение');
            } else {
                console.log('WhiteScreenDetector: исправления применены');
            }
        } catch (e) {
            console.error('WhiteScreenDetector: Ошибка при попытке исправить белый экран:', e);
        }
    }
}

// Создаем экземпляр детектора и экспортируем его
export const whiteScreenDetector = new WhiteScreenDetector();

// Автоматический запуск в браузере в режиме разработки
if (process.env.NODE_ENV !== 'production' || !window.Telegram?.WebApp) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            whiteScreenDetector.start();
        }, 3000); // Даем приложению 3 секунды на инициализацию
    });
}

export default whiteScreenDetector;
