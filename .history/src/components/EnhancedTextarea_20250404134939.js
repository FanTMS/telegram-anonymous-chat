import React, { useState, useRef, useEffect } from 'react';

/**
 * Улучшенный компонент текстовой области с плавающим лейблом
 */
const EnhancedTextarea = ({
    id,
    name,
    label,
    value,
    onChange,
    minLength,
    maxLength,
    rows = 4,
    placeholder = '',
    error = null,
    hint = null,
    className = '',
    required = false,
    autoFocus = false
}) => {
    const [focused, setFocused] = useState(false);
    const [textValue, setTextValue] = useState(value || '');
    const textareaRef = useRef(null);

    // Синхронизация с внешним значением value
    useEffect(() => {
        if (value !== undefined && value !== textValue) {
            setTextValue(value);
        }
    }, [value, textValue]);

    // Автофокус при монтировании, если указан
    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setTextValue(newValue);
        
        if (onChange) {
            onChange(e);
        }
    };

    const handleFocus = () => {
        setFocused(true);
    };

    const handleBlur = () => {
        setFocused(false);
    };

    const hasValue = textValue && textValue.length > 0;
    const remainingChars = maxLength ? maxLength - (textValue?.length || 0) : null;
    const hasError = !!error;

    return (
        <div 
            className={`enhanced-textarea-container ${focused ? 'focused' : ''} ${hasError ? 'has-error' : ''} ${className}`}
        >
            <label 
                htmlFor={id} 
                className={`enhanced-textarea-label ${(focused || hasValue) ? 'active' : ''}`}
            >
                {label}{required && <span className="required-mark">*</span>}
            </label>
            
            <div className="enhanced-textarea-wrapper">
                <textarea
                    ref={textareaRef}
                    id={id}
                    name={name}
                    className="enhanced-textarea"
                    value={textValue || ''}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    rows={rows}
                    placeholder={focused ? placeholder : ''}
                    minLength={minLength}
                    maxLength={maxLength}
                    required={required}
                />
                
                <div className="enhanced-textarea-bottom-line">
                    <div 
                        className="enhanced-textarea-focus-line" 
                        style={{ width: focused ? '100%' : '0' }}
                    ></div>
                </div>
            </div>
            
            {maxLength && (
                <div className="char-counter">
                    {remainingChars} символов осталось
                </div>
            )}
            
            {error && <div className="enhanced-textarea-error">{error}</div>}
            {!error && hint && <div className="enhanced-textarea-hint">{hint}</div>}
        </div>
    );
};

export default EnhancedTextarea;
