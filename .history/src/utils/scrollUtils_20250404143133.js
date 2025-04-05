/**
 * Плавно прокручивает страницу к указанному элементу
 * @param {string|HTMLElement} target - ID элемента или сам элемент
 * @param {number} duration - Длительность анимации в мс
 * @param {number} offset - Смещение в пикселях (отрицательное значение для прокрутки выше элемента)
 */
export const scrollToElement = (target, duration = 500, offset = 0) => {
    try {
        let targetElement;
        
        if (typeof target === 'string') {
            targetElement = document.getElementById(target);
        } else if (target instanceof HTMLElement) {
            targetElement = target;
        } else {
            console.warn('Invalid target for scrollToElement');
            return;
        }
        
        if (!targetElement) {
            console.warn('Target element not found');
            return;
        }
        
        const startPosition = window.pageYOffset;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset + offset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = easeOutCubic(progress);
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                window.requestAnimationFrame(animation);
            }
        };
        
        // Функция плавности
        const easeOutCubic = (t) => {
            return 1 - Math.pow(1 - t, 3);
        };
        
        window.requestAnimationFrame(animation);
    } catch (error) {
        console.warn('Error in scrollToElement:', error);
        // Фолбэк для безопасности
        if (typeof target === 'string') {
            const element = document.getElementById(target);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        } else if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

/**
 * Вычисляет и возвращает процент прокрученной страницы
 * @returns {number} Процент прокрутки (0-100)
 */
export const getScrollProgress = () => {
    try {
        const windowHeight = window.innerHeight;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        
        if (documentHeight <= windowHeight) {
            return 100; // Если контент умещается на экране, прогресс всегда 100%
        }
        
        return (scrollTop / (documentHeight - windowHeight)) * 100;
    } catch (error) {
        console.warn('Error calculating scroll progress:', error);
        return 0;
    }
};
