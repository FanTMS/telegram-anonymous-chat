import { analytics, EventType } from './analytics';

/**
 * Интерфейс для метрик производительности
 */
interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    timestamp: number;
}

/**
 * Монитор производительности приложения
 */
class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private markers: Record<string, number> = {};
    private isEnabled = true;

    /**
     * Включить/выключить мониторинг производительности
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Установить маркер времени
     */
    mark(name: string): void {
        if (!this.isEnabled) return;

        this.markers[name] = performance.now();
    }
    now(): number {
        throw new Error('Method not implemented.');
    }

    /**
     * Измерить время между двумя маркерами
     */
    measure(name: string, startMark: string, endMark?: string): number {
        if (!this.isEnabled) return 0;

        try {
            const startTime = this.markers[startMark];
            if (startTime === undefined) {
                console.warn(`Маркер '${startMark}' не найден`);
                return 0;
            }

            const endTime = endMark
                ? this.markers[endMark]
                : performance.now();

            if (endMark && endTime === undefined) {
                console.warn(`Маркер '${endMark}' не найден`);
                return 0;
            }

            const duration = endTime - startTime;

            this.recordMetric({
                name,
                value: duration,
                unit: 'ms',
                timestamp: Date.now()
            });

            return duration;
        } catch (error) {
            console.error('Ошибка при измерении производительности:', error);
            return 0;
        }
    }

    /**
     * Записать произвольную метрику
     */
    recordMetric(metric: PerformanceMetric): void {
        if (!this.isEnabled) return;

        this.metrics.push(metric);

        // Отправляем метрику в аналитику
        analytics.track(EventType.PERFORMANCE, metric.name, {
            value: metric.value,
            unit: metric.unit
        });
    }

    /**
     * Получить все записанные метрики
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Очистить все записанные метрики
     */
    clearMetrics(): void {
        this.metrics = [];
    }

    /**
     * Измерить время загрузки основных веб-витальных показателей
     */
    measureWebVitals(): void {
        if (!this.isEnabled) return;

        try {
            if ('performance' in window) {
                // Регистрируем наблюдатель за производительностью
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        // Записываем метрики веб-витальных показателей
                        this.recordMetric({
                            name: entry.name,
                            value: entry.startTime,
                            unit: 'ms',
                            timestamp: Date.now()
                        });
                    });
                });

                // Наблюдаем за LCP, FID, CLS
                observer.observe({ type: 'largest-contentful-paint', buffered: true });
                observer.observe({ type: 'first-input', buffered: true });
                observer.observe({ type: 'layout-shift', buffered: true });
            }
        } catch (error) {
            console.warn('Ошибка при измерении Web Vitals:', error);
        }
    }
}

export const performance = new PerformanceMonitor();
export default performance;
