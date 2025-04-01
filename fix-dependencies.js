/**
 * Скрипт для исправления проблем с зависимостями после npm install
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚙️ Запуск скрипта исправления зависимостей...');

// Проверка наличия node_modules
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('📂 Папка node_modules не найдена. Создание...');
    fs.mkdirSync(path.join(__dirname, 'node_modules'), { recursive: true });
}

// Проверка и установка cross-env, если отсутствует
try {
    require.resolve('cross-env');
    console.log('✅ cross-env найден');
} catch (e) {
    console.log('⚠️ cross-env не установлен. Установка...');
    try {
        execSync('npm install --save-dev cross-env --no-fund', { stdio: 'inherit' });
        console.log('✅ cross-env успешно установлен');
    } catch (err) {
        console.error('❌ Не удалось установить cross-env:', err.message);
    }
}

// Проверка совместимости версии Node.js
const nodeVersion = process.version;
console.log(`ℹ️ Используется Node.js ${nodeVersion}`);

if (nodeVersion.startsWith('v22.') || nodeVersion.startsWith('v21.') || nodeVersion.startsWith('v20.')) {
    console.log(`⚠️ Вы используете новую версию Node.js (${nodeVersion})`);
    console.log('ℹ️ Приложение настроено для работы с дополнительными параметрами:');
    console.log('   - --openssl-legacy-provider: для совместимости криптографических модулей');
    console.log('   - --no-deprecation: для скрытия предупреждений об устаревших функциях');

    // Автоматическое исправление .env файла для Node.js v22
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = 'NODE_OPTIONS=--openssl-legacy-provider --no-deprecation --max-old-space-size=4096\n';

        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Файл .env обновлен для совместимости с Node.js v22');
    } catch (error) {
        console.error('❌ Ошибка при обновлении файла .env:', error.message);
    }
}

// Проверка наличия и создание .npmrc
const npmrcPath = path.join(__dirname, '.npmrc');
if (!fs.existsSync(npmrcPath)) {
    console.log('📄 Создание файла .npmrc с рекомендуемыми настройками...');
    const npmrcContent = 'legacy-peer-deps=true\nengine-strict=false\nfund=false\n';
    fs.writeFileSync(npmrcPath, npmrcContent, 'utf8');
    console.log('✅ Файл .npmrc создан');
}

// Создание директории scripts, если не существует
const scriptsDir = path.join(__dirname, 'scripts');
if (!fs.existsSync(scriptsDir)) {
    console.log('📁 Создание директории scripts...');
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log('✅ Директория scripts создана');
}

console.log('✅ Скрипт исправления зависимостей завершен');
