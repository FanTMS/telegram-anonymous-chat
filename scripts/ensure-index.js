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

// Получаем PUBLIC_URL из package.json или .env.production
let publicUrl = '';
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    publicUrl = packageJson.homepage || '';
    
    // Уберем trailing slash если он есть
    if (publicUrl && publicUrl.endsWith('/')) {
        publicUrl = publicUrl.slice(0, -1);
    }
    
    console.log(`📦 Найден homepage: ${publicUrl}`);
} catch (error) {
    console.error('❌ Ошибка при чтении package.json:', error);
}

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
        console.log('📄 Копирование index-spa.html в index.html с заменой %PUBLIC_URL%...');
        // Читаем содержимое файла
        let content = fs.readFileSync(spaIndexPath, 'utf8');
        
        // Заменяем %PUBLIC_URL% на актуальное значение
        content = content.replace(/%PUBLIC_URL%/g, publicUrl);
        
        // Записываем обновленное содержимое в index.html
        fs.writeFileSync(indexPath, content);
        console.log('✅ Файл index.html успешно создан с заменой %PUBLIC_URL%');
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
    <link rel="icon" href="${publicUrl}/favicon.ico" />
    <link rel="manifest" href="${publicUrl}/manifest.json" />
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
    // Если файл существует, проверим, есть ли в нем %PUBLIC_URL% и заменим их
    let content = fs.readFileSync(indexPath, 'utf8');
    if (content.includes('%PUBLIC_URL%')) {
        console.log('⚠️ Обнаружен шаблон %PUBLIC_URL% в существующем index.html, заменяем...');
        content = content.replace(/%PUBLIC_URL%/g, publicUrl);
        fs.writeFileSync(indexPath, content);
        console.log('✅ %PUBLIC_URL% заменен на', publicUrl);
    } else {
        console.log('✅ Файл index.html уже существует и не содержит шаблонов');
    }
}

console.log('✅ Проверка файла index.html завершена'); 