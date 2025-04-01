/**
 * Скрипт для сборки проекта в Netlify
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Подготовка к сборке для Netlify...');

// Проверяем версию Node.js
console.log(`📊 Используется Node.js ${process.version}`);

try {
    // Устанавливаем cross-env глобально для Netlify
    console.log('🔄 Установка cross-env глобально...');
    execSync('npm install -g cross-env', { stdio: 'inherit' });

    // Проверяем установку
    execSync('which cross-env || echo "cross-env not found"', { stdio: 'inherit' });

    console.log('📦 Подготовка переменных окружения...');
    // Устанавливаем необходимые переменные окружения 
    process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-deprecation';
    process.env.GENERATE_SOURCEMAP = 'false';

    // Создаем .env файл для сборки
    const envContent = `
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
`;
    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);

    console.log('🛠 Выполнение команды сборки...');
    // Используем npx для запуска react-scripts без зависимости от cross-env
    execSync('npx react-scripts build', {
        stdio: 'inherit',
        env: {
            ...process.env
        }
    });
    console.log('✅ Сборка успешно завершена!');
} catch (error) {
    console.error('❌ Ошибка при сборке:', error.message);
    console.error('Подробности ошибки:', error);
    process.exit(1);
}
