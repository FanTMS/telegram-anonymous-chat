/**
 * Скрипт для создания favicon.ico для приложения
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 Генерация favicon.ico для приложения...');

// Основные пути к файлам
const publicDir = path.join(__dirname, '..', 'public');
const faviconPath = path.join(publicDir, 'favicon.ico');

// Создание favicon.ico
const createFavicon = () => {
    try {
        // Минимальный .ico файл
        const icoHeader = Buffer.from([
            0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68, 0x00, 
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        fs.writeFileSync(faviconPath, icoHeader);
        console.log('✅ favicon.ico создан');
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при создании favicon.ico: ${error.message}`);
        return false;
    }
};

// Основная логика
const generateFavicon = async () => {
    // Проверяем существование директории public
    if (!fs.existsSync(publicDir)) {
        console.error(`❌ Директория public не найдена по пути: ${publicDir}`);
        return false;
    }

    // Создаем favicon
    return createFavicon();
};

// Запускаем генерацию
generateFavicon()
    .then((success) => {
        if (success) {
            console.log('✅ Генерация favicon.ico успешно завершена!');
        } else {
            console.warn('⚠️ Не удалось создать favicon.ico корректно.');
        }
    })
    .catch((error) => {
        console.error(`❌ Ошибка при генерации favicon.ico: ${error.message}`);
    }); 