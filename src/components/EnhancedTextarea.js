import React, { useState, forwardRef } from 'react';
import AnimatedTransition from './AnimatedTransition';

/**
 * Улучшенная текстовая область с анимациями и автоматическим изменением размера
 */
const EnhancedTextarea = forwardRef(({
    id,
    name,
    label,
    value,
    onChange,
    placeholder = ' ',
    hint,
    error,
    rows = 3,
    maxLength,
    className = '',
    ...rest
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const containerClass = `enhanced-textarea-container ${className} ${isFocused ? 'focused' : ''} ${error ? 'has-error' : ''}`;
    const labelClass = `enhanced-textarea-label ${(isFocused || value) ? 'active' : ''}`;

    // Отображение счётчика символов при наличии maxLength
    const charCount = value?.length || 0;
    const showCounter = typeof maxLength === 'number';

    return (
        <div className={containerClass}>
            <div className="enhanced-textarea-field">
                <textarea
                    id={id}
                    ref={ref}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    className="enhanced-textarea"
                    {...rest}
                />

                {label && (
                    <label htmlFor={id} className={labelClass}>
                        {label}
                    </label>
                )}

                <div className="enhanced-textarea-bottom-line">
                    <div className="enhanced-textarea-focus-line" />
                </div>
            </div>

            <div className="enhanced-textarea-footer">
                {showCounter && (
                    <div className="enhanced-textarea-counter">
                        {charCount}/{maxLength}
                    </div>
                )}

                {error && (
                    <AnimatedTransition animation="fadeIn" duration={300}>
                        <div className="enhanced-textarea-error">{error}</div>
                    </AnimatedTransition>
                )}

                {hint && !error && (
                    <div className="enhanced-textarea-hint">{hint}</div>
                )}
            </div>
        </div>
    );
});

export default EnhancedTextarea;
