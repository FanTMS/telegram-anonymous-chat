import React, { useState, forwardRef } from 'react';
import AnimatedTransition from './AnimatedTransition';

/**
 * Улучшенное поле ввода с анимациями и эффектами
 */
const EnhancedInput = forwardRef(({
    id,
    name,
    label,
    value,
    onChange,
    type = 'text',
    placeholder = ' ',
    hint,
    error,
    icon,
    iconPosition = 'left',
    iconSize = 'normal', // Новый параметр
    animateLabel = true,
    className = '',
    ...rest
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const containerClass = `enhanced-input-container ${className} ${isFocused ? 'focused' : ''} ${error ? 'has-error' : ''} ${icon ? `has-icon icon-${iconPosition} icon-${iconSize}` : ''}`;
    const labelClass = `enhanced-input-label ${(isFocused || value) && animateLabel ? 'active' : ''}`;

    return (
        <div className={containerClass}>
            {icon && <span className="enhanced-input-icon">{icon}</span>}

            <div className="enhanced-input-field">
                <input
                    id={id}
                    ref={ref}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className="enhanced-input"
                    {...rest}
                />

                {label && (
                    <label htmlFor={id} className={labelClass}>
                        {label}
                    </label>
                )}

                <div className="enhanced-input-bottom-line">
                    <div className="enhanced-input-focus-line" />
                </div>
            </div>

            {error && (
                <AnimatedTransition animation="fadeIn" duration={300}>
                    <div className="enhanced-input-error">{error}</div>
                </AnimatedTransition>
            )}

            {hint && !error && (
                <div className="enhanced-input-hint">{hint}</div>
            )}
        </div>
    );
});

export default EnhancedInput;
