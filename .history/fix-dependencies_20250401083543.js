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
        execSync('npm install --save-dev cross-env', { stdio: 'inherit' });
        console.log('✅ cross-env успешно установлен');
    } catch (err) {
        console.error('❌ Не удалось установить cross-env:', err.message);
    }
}

// Проверка совместимости версии Node.js
const nodeVersion = process.version;
console.log(`ℹ️ Используется Node.js ${nodeVersion}`);

const recommendedVersion = 'v18.17.1';
if (nodeVersion.startsWith('v22.') || nodeVersion.startsWith('v21.') || nodeVersion.startsWith('v20.')) {
    console.log(`⚠️ Вы используете новую версию Node.js (${nodeVersion}). Для большей стабильности рекомендуется использовать ${recommendedVersion}`);
    console.log('ℹ️ Приложение настроено для работы с флагом --openssl-legacy-provider');
}

// Проверка наличия и создание .npmrc
const npmrcPath = path.join(__dirname, '.npmrc');
if (!fs.existsSync(npmrcPath)) {
    console.log('📄 Создание файла .npmrc с рекомендуемыми настройками...');
    fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\nengine-strict=false\nfund=false\n');
    console.log('✅ Файл .npmrc создан');
}

console.log('✅ Скрипт исправления зависимостей завершен');
