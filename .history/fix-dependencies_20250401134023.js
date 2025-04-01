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
    let envContent = `NODE_OPTIONS=--openssl-legacy-provider --no-deprecation --max-old-space-size=4096

# Отключение генерации source maps для предотвращения предупреждений
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true

# Настройка режима development для ESLint
ESLINT_NO_DEV_ERRORS=true

# Отключить открытие браузера автоматически при запуске
BROWSER=none

# Игнорировать предупреждения source-map-loader
TSC_COMPILE_ON_ERROR=true

# Firebase конфигурация
REACT_APP_FIREBASE_API_KEY=AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g
REACT_APP_FIREBASE_AUTH_DOMAIN=oleop-19cc2.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://oleop-19cc2-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=oleop-19cc2
REACT_APP_FIREBASE_STORAGE_BUCKET=oleop-19cc2.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=452609655600
REACT_APP_FIREBASE_APP_ID=1:452609655600:web:95c47ff9b3ea191f6fbef5
REACT_APP_FIREBASE_MEASUREMENT_ID=G-X4DP12TNSB
`;

    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Файл .env обновлен для совместимости');
} catch (error) {
    console.error('❌ Ошибка при обновлении файла .env:', error.message);
}

console.log('✅ Скрипт исправления зависимостей завершен');

/**
 * Скрипт для исправления несовместимых зависимостей после установки пакетов
 */
console.log('🔧 Исправление зависимостей...');

try {
    // Устанавливаем совместимые версии пакетов
    console.log('📦 Установка совместимых версий ajv и ajv-keywords...');
    execSync('npm install ajv@6.12.6 ajv-keywords@3.5.2 --save-exact --no-save', {
        stdio: 'inherit',
        env: {
            ...process.env,
            FORCE: 'true',
            NPM_CONFIG_LEGACY_PEER_DEPS: 'true'
        }
    });

    console.log('✅ Зависимости успешно исправлены');
} catch (error) {
    console.warn('⚠️ Предупреждение при исправлении зависимостей:', error.message);
    console.log('🔄 Попытка продолжить установку с оригинальными зависимостями...');
}
