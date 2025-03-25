import React, { useState, useEffect } from 'react';

interface RippleProps {
    duration?: number;
    color?: string;
}

export const Ripple: React.FC<RippleProps> = ({ duration = 600, color = 'rgba(255, 255, 255, 0.3)' }) => {
    const [rippleArray, setRippleArray] = useState<Array<{ x: number, y: number, size: number }>>([]);

    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            let x = 0;
            let y = 0;

            if (e instanceof MouseEvent) {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            } else {
                const touch = e.touches[0];
                x = touch.clientX - rect.left;
                y = touch.clientY - rect.top;
            }

            const size = Math.max(rect.width, rect.height) * 2;

            setRippleArray(prevRipples => [
                ...prevRipples,
                { x, y, size }
            ]);

            setTimeout(() => {
                setRippleArray(prevRipples => prevRipples.slice(1));
            }, duration);
        };

        // Привязываем обработчик к элементам с классом .bot-command-chip
        const elements = document.querySelectorAll('.bot-command-chip');
        elements.forEach(el => {
            el.addEventListener('mousedown', handler);
            el.addEventListener('touchstart', handler);
        });

        return () => {
            elements.forEach(el => {
                el.removeEventListener('mousedown', handler);
                el.removeEventListener('touchstart', handler);
            });
        };
    }, [duration]);

    return (
        <>
            {rippleArray.map((ripple, index) => (
                <span
                    key={`ripple_${index}`}
                    className="ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size,
                        backgroundColor: color,
                        animationDuration: `${duration}ms`
                    }}
                />
            ))}
        </>
    );
};

export default Ripple;
