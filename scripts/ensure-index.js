/**
 * Скрипт для обеспечения наличия файла index.html в директории build
 * Если файл отсутствует, он будет создан на основе index-spa.html
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка наличия файла index.html в директории build...');

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');
const spaIndexPath = path.join(buildDir, 'index-spa.html');

// Проверяем существование директории build
if (!fs.existsSync(buildDir)) {
    console.error('❌ Директория build не существует!');
    process.exit(1);
}

// Проверяем наличие файла index.html
if (!fs.existsSync(indexPath)) {
    console.log('⚠️ Файл index.html отсутствует!');
    
    // Проверяем наличие index-spa.html для копирования
    if (fs.existsSync(spaIndexPath)) {
        console.log('📄 Копирование index-spa.html в index.html...');
        fs.copyFileSync(spaIndexPath, indexPath);
        console.log('✅ Файл index.html успешно создан из index-spa.html');
    } else {
        console.log('📝 Файл index-spa.html не найден, создаем базовый index.html...');
        
        // Создаем простой index.html с редиректом на приложение
        const basicHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Telegram Anonymous Chat</title>
    <base href="/" />
    <script>
        // Перенаправляем на главную страницу
        window.location.href = '/register';
    </script>
</head>
<body>
    <noscript>Для работы приложения необходимо включить JavaScript.</noscript>
    <div id="root"></div>
</body>
</html>`;

        fs.writeFileSync(indexPath, basicHtml);
        console.log('✅ Создан базовый index.html с редиректом');
    }
} else {
    console.log('✅ Файл index.html уже существует');
}

console.log('✅ Проверка файла index.html завершена'); 