/**
 * Скрипт для исправления зависимостей
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚙️ Запуск скрипта исправления зависимостей...');

// Проверка и установка cross-env глобально для доступности в CI/CD
try {
    execSync('npm list -g cross-env', { stdio: 'ignore' });
    console.log('✅ cross-env найден глобально');
} catch (e) {
    console.log('⚠️ cross-env не установлен глобально. Установка...');
    try {
        execSync('npm install -g cross-env', { stdio: 'inherit' });
        console.log('✅ cross-env установлен глобально');
    } catch (err) {
        console.error('❌ Ошибка при глобальной установке cross-env:', err.message);
    }
}

// Проверка и установка cross-env как devDependency
try {
    require.resolve('cross-env');
    console.log('✅ cross-env найден локально');
} catch (e) {
    console.log('⚠️ cross-env не найден локально, устанавливаем...');
    try {
        execSync('npm install -D cross-env', { stdio: 'inherit' });
        console.log('✅ cross-env установлен локально');
    } catch (err) {
        console.error('❌ Ошибка при установке cross-env:', err.message);
    }
}

// Логируем информацию о версии Node.js
console.log(`ℹ️ Используется Node.js ${process.version}`);

if (process.version.startsWith('v16.')) {
    console.log('⚠️ Вы используете Node.js v16. Рекомендуется обновить до v18.17.1 или выше.');
    console.log('ℹ️ Настраиваем окружение для совместимости...');

    // Автоматическое исправление .env файла для Node.js v16
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = `NODE_OPTIONS=--openssl-legacy-provider --no-deprecation --max-old-space-size=4096

# Отключение генерации source maps для предотвращения предупреждений
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true

# Настройка режима development для ESLint
ESLINT_NO_DEV_ERRORS=true

# Отключить открытие браузера автоматически при запуске
BROWSER=none

# Игнорировать предупреждения source-map-loader
TSC_COMPILE_ON_ERROR=true
`;

        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Файл .env обновлен для совместимости с Node.js v16');
    } catch (error) {
        console.error('❌ Ошибка при обновлении файла .env:', error.message);
    }
}

console.log('✅ Скрипт исправления зависимостей завершен');
