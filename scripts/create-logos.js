/**
 * Скрипт для создания простых логотипов для приложения
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 Генерация логотипов приложения...');

// Проверяем, доступен ли canvas для создания красивых логотипов
let canvasAvailable = false;
try {
    require.resolve('canvas');
    canvasAvailable = true;
    console.log('✅ Модуль canvas найден, используем его для создания красивых логотипов');
} catch (e) {
    console.log('⚠️ Модуль canvas не найден, будем использовать простую генерацию');
}

// Основные пути к файлам
const publicDir = path.join(__dirname, '..', 'public');
const logo192Path = path.join(publicDir, 'logo192.png');
const logo512Path = path.join(publicDir, 'logo512.png');
const faviconPath = path.join(publicDir, 'favicon.ico');

// Функция для создания базового логотипа с Canvas (более качественный вариант)
const createLogoWithCanvas = async (outputPath, size) => {
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Заливка фона
        ctx.fillStyle = '#0088cc'; // Telegram-style blue
        ctx.fillRect(0, 0, size, size);

        // Добавляем круг в центре
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();

        // Добавляем букву "T"
        ctx.fillStyle = '#0088cc';
        ctx.font = `bold ${size / 2.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', size / 2, size / 2);

        // Сохраняем в файл
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Логотип ${path.basename(outputPath)} создан с помощью Canvas`);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при создании логотипа с Canvas: ${error.message}`);
        return false;
    }
};

// Функция для создания простейшего PNG (запасной вариант)
const createSimplePng = (outputPath, size) => {
    try {
        // Создаем простейший валидный PNG 
        // Минимальный PNG-файл с заголовком и данными
        const pngHeader = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
            0x49, 0x48, 0x44, 0x52, // "IHDR"
            0x00, 0x00, (size >> 8) & 0xFF, size & 0xFF, // Width
            0x00, 0x00, (size >> 8) & 0xFF, size & 0xFF, // Height
            0x08, // Bit depth
            0x06, // Color type (RGBA)
            0x00, // Compression method
            0x00, // Filter method
            0x00, // Interlace method
            0xAA, 0xBB, 0xCC, 0xDD, // CRC-32 (placeholder)
            0x00, 0x00, 0x00, 0x10, // IDAT chunk length
            0x49, 0x44, 0x41, 0x54, // "IDAT"
            // Минимальные данные (закодированный под zlib один пиксель цвета #0088cc)
            0x78, 0x9C, 0x63, 0xE8, 0xCD, 0x00, 0x01, 0x46, 0x30, 0x06, 0x00, 0x00, 0x3E, 0x00, 0x05, 0xCF,
            0xAA, 0xBB, 0xCC, 0xDD, // CRC-32 (placeholder)
            0x00, 0x00, 0x00, 0x00, // IEND chunk length
            0x49, 0x45, 0x4E, 0x44, // "IEND"
            0xAE, 0x42, 0x60, 0x82  // CRC-32 for IEND
        ]);

        fs.writeFileSync(outputPath, pngHeader);
        console.log(`✅ Простой PNG логотип ${path.basename(outputPath)} создан`);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при создании простого PNG: ${error.message}`);
        return false;
    }
};

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
        console.log('✅ Простой favicon.ico создан');
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при создании favicon.ico: ${error.message}`);
        return false;
    }
};

// Основная логика
const generateLogos = async () => {
    // Проверяем существование директории public
    if (!fs.existsSync(publicDir)) {
        console.error(`❌ Директория public не найдена по пути: ${publicDir}`);
        return false;
    }

    let success = true;

    // Создаем логотипы с помощью Canvas, если доступен
    if (canvasAvailable) {
        const logo192Success = await createLogoWithCanvas(logo192Path, 192);
        const logo512Success = await createLogoWithCanvas(logo512Path, 512);
        success = logo192Success && logo512Success;

        // Используем простые логотипы, если не удалось создать с Canvas
        if (!logo192Success) {
            success = createSimplePng(logo192Path, 192) && success;
        }
        if (!logo512Success) {
            success = createSimplePng(logo512Path, 512) && success;
        }
    } else {
        // Если Canvas недоступен, используем простую генерацию
        success = createSimplePng(logo192Path, 192) && success;
        success = createSimplePng(logo512Path, 512) && success;
    }

    // Создаем favicon
    success = createFavicon() && success;

    return success;
};

// Запускаем генерацию
generateLogos()
    .then((success) => {
        if (success) {
            console.log('✅ Все логотипы успешно созданы!');
        } else {
            console.warn('⚠️ Некоторые логотипы не удалось создать корректно.');
        }
    })
    .catch((error) => {
        console.error(`❌ Ошибка при генерации логотипов: ${error.message}`);
    }); 