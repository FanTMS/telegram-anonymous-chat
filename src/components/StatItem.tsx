import React from 'react';

interface StatItemProps {
    label: string;
    value: string | number;
    icon: string;
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, icon }) => {
    // Преобразуем value в строку безопасным способом
    const displayValue = value === null || value === undefined
        ? '0'
        : typeof value === 'number'
            ? Number.isFinite(value) ? value.toString() : '0'
            : value;

    return (
        <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-lg font-bold">{displayValue}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        </div>
    );
};
