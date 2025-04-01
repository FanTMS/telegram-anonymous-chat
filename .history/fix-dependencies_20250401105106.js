/**
 * Скрипт для исправления зависимостей
 */
console.log('⚙️ Запуск скрипта исправления зависимостей...');

try {
    // Проверяем наличие cross-env
    const hasCrossEnv = require('cross-env');
    console.log('✅ cross-env найден');
} catch (e) {
    console.log('⚠️ cross-env не найден, устанавливаем...');
    try {
        const { execSync } = require('child_process');
        execSync('npm install -D cross-env', { stdio: 'inherit' });
        console.log('✅ cross-env установлен');
    } catch (err) {
        console.error('❌ Ошибка при установке cross-env:', err.message);
    }
}

// Логируем информацию о версии Node.js
console.log(`ℹ️ Используется Node.js ${process.version}`);

// Проверяем версию Node.js для предупреждений о совместимости
const nodeVersion = process.version.replace('v', '').split('.');
const majorVersion = parseInt(nodeVersion[0]);

if (majorVersion < 16) {
    console.warn('⚠️ Предупреждение: Рекомендуется использовать Node.js 16 или выше');
}

console.log('✅ Скрипт исправления зависимостей завершен');
