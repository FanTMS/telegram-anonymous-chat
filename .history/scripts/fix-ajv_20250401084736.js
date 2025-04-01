/**
 * Скрипт для исправления проблем с пакетами ajv и ajv-keywords
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Исправление проблем с ajv и зависимостями...');

// Путь к node_modules
const nodeModulesDir = path.join(__dirname, '..', 'node_modules');

// Функция для установки конкретной версии пакета
function installPackage(packageName, version) {
    try {
        console.log(`📦 Установка ${packageName}@${version}...`);
        execSync(`npm install ${packageName}@${version} --no-save`, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`❌ Ошибка установки ${packageName}:`, error.message);
        return false;
    }
}

// Проверка и исправление проблемы с ajv
async function fixAjvDependencies() {
    // Устанавливаем совместимые версии пакетов
    const installations = [
        installPackage('ajv', '6.12.6'),
        installPackage('ajv-keywords', '3.5.2')
    ];
    
    if (installations.every(Boolean)) {
        console.log('✅ Пакеты ajv и ajv-keywords успешно установлены');
    } else {
        console.log('⚠️ Возникли проблемы при установке некоторых пакетов');
    }
}

// Запускаем исправление
fixAjvDependencies().then(() => {
    console.log('✅ Исправления зависимостей завершены');
    console.log('🚀 Теперь вы можете запустить npm start');
}).catch(error => {
    console.error('❌ Произошла ошибка:', error);
});
