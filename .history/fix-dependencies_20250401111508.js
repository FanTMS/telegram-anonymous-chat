/**
 * Скрипт для исправления зависимостей
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚙️ Запуск скрипта исправления зависимостей...');

// Проверяем, запускаемся ли мы в CI окружении
const isCI = process.env.CI === 'true';
console.log(isCI ? '🚀 Запуск в CI окружении' : '💻 Запуск в локальном окружении');

// В CI среде не нужно устанавливать глобальные зависимости
if (!isCI) {
    // Проверка и установка cross-env глобально в локальной среде
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
}

// Проверяем, есть ли cross-env в node_modules
try {
    require.resolve('cross-env');
    console.log('✅ cross-env найден локально');
} catch (e) {
    console.log('⚠️ cross-env не найден локально, устанавливаем...');
    try {
        execSync('npm install cross-env --save', { stdio: 'inherit' });
        console.log('✅ cross-env установлен локально');
    } catch (err) {
        console.error('❌ Ошибка при установке cross-env:', err.message);
    }
}

// Логируем информацию о версии Node.js
console.log(`ℹ️ Используется Node.js ${process.version}`);

// Автоматическое исправление .env файла
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
    console.log('✅ Файл .env обновлен для совместимости');
} catch (error) {
    console.error('❌ Ошибка при обновлении файла .env:', error.message);
}

console.log('✅ Скрипт исправления зависимостей завершен');
