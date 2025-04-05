const fs = require('fs');
const path = require('path');

console.log('Подготовка проекта к деплою...');

const buildDir = path.join(__dirname, '..', 'build');
const publicDir = path.join(__dirname, '..', 'public');

// Функция создания директории, если она не существует
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Создана директория: ${dirPath}`);
    }
};

// Функция копирования файла
const copyFile = (source, destination) => {
    try {
        fs.copyFileSync(source, destination);
        console.log(`✅ Файл скопирован: ${destination}`);
    } catch (error) {
        console.error(`❌ Ошибка при копировании файла ${source}:`, error.message);
    }
};

// Создаем директорию build, если её нет
ensureDirectoryExists(buildDir);

// Проверяем и создаем файл _redirects в build
const redirectsSource = path.join(publicDir, '_redirects');
const redirectsDest = path.join(buildDir, '_redirects');

if (fs.existsSync(redirectsSource)) {
    copyFile(redirectsSource, redirectsDest);
} else {
    // Если файла нет, создаем его
    fs.writeFileSync(redirectsDest, '/*  /index.html  200');
    console.log(`✅ Создан файл _redirects в директории build`);
}

// Проверяем и копируем файл 404.html в build
const notFoundSource = path.join(publicDir, '404.html');
const notFoundDest = path.join(buildDir, '404.html');

if (fs.existsSync(notFoundSource)) {
    copyFile(notFoundSource, notFoundDest);
} else {
    console.log('⚠️ Файл 404.html не найден в директории public');
}

// Проверка наличия netlify.toml
const netlifyTomlPath = path.join(__dirname, '..', 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
    console.log('✅ Файл netlify.toml найден');
} else {
    console.log('⚠️ Файл netlify.toml не найден в корне проекта');
}

console.log('✅ Подготовка проекта к деплою завершена.');
