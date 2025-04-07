/**
 * Скрипт для обеспечения наличия файла index.html в директории build
 * Если файл отсутствует, он будет создан на основе index-spa.html
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Проверка наличия файла index.html в директории build...');

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');
const spaIndexPath = path.join(buildDir, 'index-spa.html');

// Получаем PUBLIC_URL из package.json или .env.production
let publicUrl = '';
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    publicUrl = packageJson.homepage || '';
    
    // Если homepage не задан или равен "/", используем пустую строку
    if (publicUrl === '/' || publicUrl === '') {
        publicUrl = '';
    } else if (publicUrl && publicUrl.endsWith('/')) {
        // Уберем trailing slash если он есть
        publicUrl = publicUrl.slice(0, -1);
    }
    
    console.log(`📦 Найден homepage: ${publicUrl || '/'}`);
} catch (error) {
    console.error('❌ Ошибка при чтении package.json:', error);
}

// Проверяем существование директории build
if (!fs.existsSync(buildDir)) {
    console.error('❌ Директория build не существует!');
    process.exit(1);
}

// Функция для поиска JS и CSS файлов
function findStaticFiles() {
    const staticDir = path.join(buildDir, 'static');
    let jsFiles = [];
    let cssFiles = [];
    
    if (fs.existsSync(staticDir)) {
        try {
            // Ищем JS файлы в директории static/js
            const jsPath = path.join(staticDir, 'js');
            if (fs.existsSync(jsPath)) {
                jsFiles = glob.sync(path.join(jsPath, '*.js'));
            }
            
            // Ищем CSS файлы в директории static/css
            const cssPath = path.join(staticDir, 'css');
            if (fs.existsSync(cssPath)) {
                cssFiles = glob.sync(path.join(cssPath, '*.css'));
            }
        } catch (error) {
            console.error('❌ Ошибка при поиске статических файлов:', error);
        }
    }
    
    return { jsFiles, cssFiles };
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
        
        // Проверяем наличие JS/CSS файлов и добавляем их
        const { jsFiles, cssFiles } = findStaticFiles();
        
        // Формируем теги для CSS файлов
        const cssLinks = cssFiles.map(file => {
            const relativePath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
            return `<link href="${relativePath}" rel="stylesheet">`;
        }).join('\n    ');
        
        // Формируем теги для JS файлов
        const jsScripts = jsFiles.map(file => {
            const relativePath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
            return `<script src="${relativePath}"></script>`;
        }).join('\n    ');
        
        // Вставляем CSS перед </head>
        if (cssLinks) {
            content = content.replace('</head>', `    ${cssLinks}\n</head>`);
        }
        
        // Вставляем JS перед </body>
        if (jsScripts) {
            content = content.replace('</body>', `    ${jsScripts}\n</body>`);
        }
        
        // Записываем обновленное содержимое в index.html
        fs.writeFileSync(indexPath, content);
        console.log('✅ Файл index.html успешно создан с заменой %PUBLIC_URL% и добавлением статических файлов');
    } else {
        console.log('📝 Файл index-spa.html не найден, создаем базовый index.html...');
        
        // Ищем статические файлы
        const { jsFiles, cssFiles } = findStaticFiles();
        
        // Формируем теги для CSS файлов
        const cssLinks = cssFiles.map(file => {
            const relativePath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
            return `    <link href="${relativePath}" rel="stylesheet">`;
        }).join('\n');
        
        // Формируем теги для JS файлов
        const jsScripts = jsFiles.map(file => {
            const relativePath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
            return `    <script src="${relativePath}"></script>`;
        }).join('\n');
        
        // Создаем простой index.html с редиректом на приложение
        const basicHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Telegram Anonymous Chat</title>
    <base href="/" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="manifest" href="/manifest.json" />
${cssLinks}
</head>
<body>
    <noscript>Для работы приложения необходимо включить JavaScript.</noscript>
    <div id="root"></div>
    <script>
        // Для SPA на Netlify, убедимся, что мы перенаправляем на правильный маршрут
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
            // Проверяем авторизацию
            const isAuthenticated = !!localStorage.getItem('current_user_id');
            // Перенаправляем соответствующим образом
            if (isAuthenticated) {
                window.location.href = '/home';
            } else {
                window.location.href = '/register';
            }
        }
    </script>
${jsScripts}
</body>
</html>`;

        fs.writeFileSync(indexPath, basicHtml);
        console.log('✅ Создан базовый index.html с редиректом и статическими файлами');
    }
} else {
    // Если файл существует, проверим, есть ли в нем %PUBLIC_URL% и заменим их
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Проверяем наличие ссылок на CSS и JS файлы
    const hasJsLinks = content.includes('<script src="/static/js/') || content.includes('<script src="static/js/');
    const hasCssLinks = content.includes('<link href="/static/css/') || content.includes('<link href="static/css/');
    
    if (!hasJsLinks || !hasCssLinks) {
        console.log('⚠️ В index.html отсутствуют ссылки на JS или CSS файлы, добавляем...');
        
        // Ищем статические файлы
        const { jsFiles, cssFiles } = findStaticFiles();
        
        // Формируем теги для CSS файлов
        const cssLinks = cssFiles.map(file => {
            const relativePath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
            return `<link href="${relativePath}" rel="stylesheet">`;
        }).join('\n    ');
        
        // Формируем теги для JS файлов
        const jsScripts = jsFiles.map(file => {
            const relativePath = '/' + path.relative(buildDir, file).replace(/\\/g, '/');
            return `<script src="${relativePath}"></script>`;
        }).join('\n    ');
        
        // Вставляем CSS перед </head> если он отсутствует
        if (!hasCssLinks && cssLinks) {
            content = content.replace('</head>', `    ${cssLinks}\n</head>`);
        }
        
        // Вставляем JS перед </body> если он отсутствует
        if (!hasJsLinks && jsScripts) {
            content = content.replace('</body>', `    ${jsScripts}\n</body>`);
        }
        
        fs.writeFileSync(indexPath, content);
        console.log('✅ Ссылки на JS и CSS файлы добавлены в index.html');
    }
    
    if (content.includes('%PUBLIC_URL%')) {
        console.log('⚠️ Обнаружен шаблон %PUBLIC_URL% в существующем index.html, заменяем...');
        content = content.replace(/%PUBLIC_URL%/g, publicUrl);
        fs.writeFileSync(indexPath, content);
        console.log('✅ %PUBLIC_URL% заменен на', publicUrl || '/');
    } else {
        console.log('✅ Файл index.html уже существует и не содержит шаблонов');
    }
}

console.log('✅ Проверка файла index.html завершена'); 