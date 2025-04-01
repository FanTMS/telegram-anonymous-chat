/**
 * Скрипт для сборки проекта в Netlify
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Подготовка к сборке для Netlify...');

// Проверяем версию Node.js
console.log(`📊 Используется Node.js ${process.version}`);

// Устанавливаем необходимые переменные окружения 
process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-deprecation';
process.env.GENERATE_SOURCEMAP = 'false';

try {
    console.log('📦 Выполнение команды сборки...');
    execSync('react-scripts build', { 
        stdio: 'inherit',
        env: { 
            ...process.env
        }
    });
    console.log('✅ Сборка успешно завершена!');
} catch (error) {
    console.error('❌ Ошибка при сборке:', error);
    process.exit(1);
}
