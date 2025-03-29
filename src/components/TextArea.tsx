import React from 'react';

export interface TextAreaProps {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    placeholder?: string;
    className?: string;
    rows?: number;
    required?: boolean;
    name?: string;
    id?: string;
    disabled?: boolean;
    maxLength?: number;
    [key: string]: any; // Для любых других пропсов, которые могут понадобиться
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
    fullWidth = false,
    className = '',
    rows = 3,
    ...props
}) => {
    const baseClass = 'tg-textarea block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500';
    const errorClass = error ? 'border-red-500 ring-1 ring-red-500' : '';
    const widthClass = fullWidth ? 'w-full' : '';
    const fullClass = `${baseClass} ${errorClass} ${widthClass} ${className}`;

    return (
        <div className={`mb-3 ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}

            <div className="relative">
                <textarea
                    className={fullClass}
                    rows={rows}
                    {...props}
                />
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default TextArea;
