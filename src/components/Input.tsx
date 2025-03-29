import React from 'react';

// Определяем тип для пропсов, который будет работать и для input, и для textarea
export interface InputProps {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  as?: 'input' | 'textarea';
  rows?: number;
  value?: string | number | readonly string[] | undefined;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  placeholder?: string;
  type?: string;
  className?: string;
  min?: number | string;
  max?: number | string;
  required?: boolean;
  name?: string;
  id?: string;
  disabled?: boolean;
  autoComplete?: string;
  [key: string]: any; // Для любых других пропсов, которые могут понадобиться
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  icon,
  as = 'input',
  rows = 3,
  ...props
}) => {
  const baseClass = 'tg-input focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500';
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
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}

        {as === 'textarea' ? (
          <textarea
            className={`${fullClass} ${icon ? 'pl-10' : ''}`}
            rows={rows}
            {...props}
          />
        ) : (
          <input
            className={`${fullClass} ${icon ? 'pl-10' : ''}`}
            {...props}
          />
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
