/**
 * Простой генератор логотипов без зависимости от canvas
 * Создает пустые файлы или копирует существующие шаблоны
 */
const fs = require('fs');
const path = require('path');

console.log('📝 Создание простых логотипов без использования canvas...');

// Пути к файлам
const publicDir = path.join(__dirname, '..', 'public');
const logo192Path = path.join(publicDir, 'logo192.png');
const logo512Path = path.join(publicDir, 'logo512.png');
const faviconPath = path.join(publicDir, 'favicon.ico');

// Проверяем наличие директории public
if (!fs.existsSync(publicDir)) {
    console.log('📁 Создание директории public...');
    fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * Создает простую иконку в формате PNG
 * @param {string} filePath - Путь для сохранения файла
 * @param {number} size - Размер иконки в пикселях
 */
const createSimplePngIcon = (filePath, size) => {
    try {
        // Проверяем, существует ли файл
        if (fs.existsSync(filePath)) {
            console.log(`✅ Файл ${path.basename(filePath)} уже существует`);
            return;
        }

        // Проверяем, есть ли шаблонный файл в папке assets
        const templateDir = path.join(__dirname, '..', 'src', 'assets');
        const templateFile = path.join(templateDir, `template-${size}.png`);

        if (fs.existsSync(templateFile)) {
            // Копируем шаблон, если он есть
            fs.copyFileSync(templateFile, filePath);
            console.log(`✅ Скопирован шаблон для ${path.basename(filePath)}`);
            return;
        }

        // Если нет шаблона, создаем пустой PNG-файл минимального размера
        // Заголовок PNG-файла (минимальный действительный PNG)
        const pngHeader = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG сигнатура
            0x00, 0x00, 0x00, 0x0D, // Длина IHDR chunk
            0x49, 0x48, 0x44, 0x52, // IHDR chunk type
            0x00, 0x00, size >> 8, size & 0xFF, // Ширина (2 байта, big-endian)
            0x00, 0x00, size >> 8, size & 0xFF, // Высота (2 байта, big-endian)
            0x08, // Глубина цвета (8 бит)
            0x06, // Тип цвета (RGBA)
            0x00, // Метод сжатия (стандартный)
            0x00, // Метод фильтрации (стандартный)
            0x00, // Метод чередования (нет)
            0x00, 0x00, 0x00, 0x00, // CRC для IHDR (некорректный, но это не имеет значения для placeholder)
            0x00, 0x00, 0x00, 0x00, // Длина IDAT chunk (пустой)
            0x49, 0x44, 0x41, 0x54, // IDAT chunk type
            0x00, 0x00, 0x00, 0x00, // Данные IDAT (пустые)
            0x00, 0x00, 0x00, 0x00, // CRC для IDAT (некорректный)
            0x00, 0x00, 0x00, 0x00, // Длина IEND chunk (пустой)
            0x49, 0x45, 0x4E, 0x44, // IEND chunk type
            0xAE, 0x42, 0x60, 0x82  // CRC для IEND
        ]);

        fs.writeFileSync(filePath, pngHeader);
        console.log(`✅ Создан пустой PNG-файл для ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`❌ Ошибка при создании файла ${path.basename(filePath)}:`, error);
    }
};

/**
 * Создает простой favicon.ico
 */
const createSimpleFavicon = (filePath) => {
    try {
        // Проверяем, существует ли файл
        if (fs.existsSync(filePath)) {
            console.log(`✅ Файл ${path.basename(filePath)} уже существует`);
            return;
        }

        // Проверяем, есть ли шаблонный файл в папке assets
        const templateDir = path.join(__dirname, '..', 'src', 'assets');
        const templateFile = path.join(templateDir, 'template-favicon.ico');

        if (fs.existsSync(templateFile)) {
            // Копируем шаблон, если он есть
            fs.copyFileSync(templateFile, filePath);
            console.log(`✅ Скопирован шаблон для ${path.basename(filePath)}`);
            return;
        }

        // Если шаблона нет, создаем пустой ICO-файл минимального размера
        // Заголовок ICO-файла (минимальный действительный ICO)
        const icoHeader = Buffer.from([
            0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
            0x20, 0x00, 0x68, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);

        fs.writeFileSync(filePath, icoHeader);
        console.log(`✅ Создан пустой ICO-файл для ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`❌ Ошибка при создании файла ${path.basename(filePath)}:`, error);
    }
};

// Создаем логотипы и favicon
createSimplePngIcon(logo192Path, 192);
createSimplePngIcon(logo512Path, 512);
createSimpleFavicon(faviconPath);

console.log('✅ Генерация простых логотипов завершена');
