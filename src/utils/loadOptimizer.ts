/**
 * Утилита для оптимизации загрузки ресурсов приложения
 * Помогает снизить нагрузку и улучшить производительность
 */
export const loadOptimizer = {
    /**
     * Выполняет функцию с заданной задержкой
     * Позволяет разделить тяжелые операции во времени
     */
    delayExecution<T>(fn: () => T, delay: number = 100): Promise<T> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = fn();
                resolve(result);
            }, delay);
        });
    },

    /**
     * Разделяет массив на чанки и обрабатывает их поочередно
     * Полезно для обработки больших массивов без блокировки UI
     */
    async processInChunks<T, R>(
        items: T[],
        processor: (item: T, index: number) => R,
        options: {
            chunkSize?: number;
            delay?: number;
            onProgress?: (processed: number, total: number) => void;
        } = {}
    ): Promise<R[]> {
        const {
            chunkSize = 10,
            delay = 50,
            onProgress
        } = options;

        const results: R[] = [];
        let processed = 0;
        const total = items.length;

        // Обрабатываем массив по чанкам
        for (let i = 0; i < total; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);

            // Обрабатываем текущий чанк
            const chunkResults = chunk.map((item, idx) => processor(item, i + idx));
            results.push(...chunkResults);

            processed += chunk.length;

            // Уведомляем о прогрессе
            if (onProgress) {
                onProgress(processed, total);
            }

            // Делаем паузу перед следующим чанком
            if (i + chunkSize < total) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return results;
    },

    /**
     * Предзагружает изображения
     */
    preloadImages(urls: string[]): Promise<void[]> {
        return Promise.all(
            urls.map(url => {
                return new Promise<void>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
                    img.src = url;
                });
            })
        );
    },

    /**
     * Откладывает выполнение неприоритетных задач после загрузки страницы
     */
    deferTask(task: () => void): void {
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => task());
        } else {
            setTimeout(task, 1000);
        }
    }
};

export default loadOptimizer;
