const fs = require('fs');
const path = require('path');

// Проверяем наличие необходимых файлов для корректной маршрутизации
console.log('Проверка настроек маршрутизации SPA...\n');

// Проверка файла _redirects
const redirectsPath = path.join(__dirname, '..', 'public', '_redirects');
if (fs.existsSync(redirectsPath)) {
    const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
    console.log('✅ Файл _redirects существует');

    if (redirectsContent.includes('/* /index.html 200')) {
        console.log('✅ Файл _redirects содержит правильное правило для SPA');
    } else {
        console.log('❌ Внимание! Файл _redirects не содержит правило "/* /index.html 200"');
        console.log('   Рекомендуется добавить эту строку в файл _redirects');
    }
} else {
    console.log('❌ Файл _redirects не найден в директории public');
    console.log('   Рекомендуется создать файл public/_redirects со следующим содержимым:');
    console.log('   /* /index.html 200');
}

console.log('');

// Проверка файла netlify.toml
const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
    const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    console.log('✅ Файл netlify.toml существует');

    if (tomlContent.includes('[[redirects]]') &&
        tomlContent.includes('from = "/*"') &&
        tomlContent.includes('to = "/index.html"') &&
        tomlContent.includes('status = 200')) {
        console.log('✅ Файл netlify.toml содержит правильные настройки редиректов для SPA');
    } else {
        console.log('❌ Внимание! Файл netlify.toml может не содержать правильные настройки для SPA');
        console.log('   Рекомендуется добавить следующий блок в netlify.toml:');
        console.log('   [[redirects]]');
        console.log('     from = "/*"');
        console.log('     to = "/index.html"');
        console.log('     status = 200');
    }
} else {
    console.log('❌ Файл netlify.toml не найден в корне проекта');
    console.log('   Рекомендуется создать файл netlify.toml с настройками сборки и редиректов');
}

console.log('');

// Проверка файла 404.html
const notFoundPath = path.join(__dirname, '..', 'public', '404.html');
if (fs.existsSync(notFoundPath)) {
    console.log('✅ Файл 404.html существует в директории public');
} else {
    console.log('❌ Файл 404.html не найден в директории public');
    console.log('   Рекомендуется создать кастомную страницу 404.html');
}

console.log('\nПроверка завершена. Если были найдены проблемы, исправьте их и повторно деплойте проект на Netlify.');
