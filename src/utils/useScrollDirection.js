import { useState, useEffect } from 'react';

/**
 * Хук для определения направления скролла
 * @param {number} threshold - Минимальное расстояние скролла для регистрации изменения
 * @returns {string} - 'up' или 'down'
 */
const useScrollDirection = (threshold = 10) => {
    const [scrollDir, setScrollDir] = useState('up');

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateScrollDir = () => {
            const scrollY = window.scrollY;

            if (Math.abs(scrollY - lastScrollY) < threshold) {
                ticking = false;
                return;
            }

            setScrollDir(scrollY > lastScrollY ? 'down' : 'up');
            lastScrollY = scrollY > 0 ? scrollY : 0;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollDir);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll);

        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return scrollDir;
};

export default useScrollDirection;
