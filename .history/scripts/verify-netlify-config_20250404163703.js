const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Проверка конфигурации Netlify...');

// Проверяем наличие необходимых файлов
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const netlifyTomlPath = path.join(rootDir, 'netlify.toml');
const redirectsPath = path.join(rootDir, 'public', '_redirects');
const buildRedirectsPath = path.join(buildDir, '_redirects');

// Проверяем netlify.toml
if (fs.existsSync(netlifyTomlPath)) {
    console.log('✅ Файл netlify.toml существует');

    const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    if (tomlContent.includes('[[redirects]]') &&
        tomlContent.includes('from = "/*"') &&
        tomlContent.includes('to = "/index.html"') &&
        tomlContent.includes('status = 200')) {
        console.log('✅ Настройки редиректов в netlify.toml корректны');
    } else {
        console.log('❌ Настройки редиректов в netlify.toml некорректны или отсутствуют');
        console.log('   Должен содержать:');
        console.log('   [[redirects]]');
        console.log('     from = "/*"');
        console.log('     to = "/index.html"');
        console.log('     status = 200');
    }
} else {
    console.log('❌ Файл netlify.toml отсутствует');
    console.log('   Создайте файл netlify.toml в корне проекта');
}

// Проверяем _redirects в public
if (fs.existsSync(redirectsPath)) {
    console.log('✅ Файл _redirects существует в директории public');

    const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
    if (redirectsContent.includes('/* /index.html 200')) {
        console.log('✅ Содержимое _redirects корректно');
    } else {
        console.log('❌ Содержимое _redirects некорректно');
        console.log('   Должен содержать строку: /* /index.html 200');
    }
} else {
    console.log('❌ Файл _redirects отсутствует в директории public');
    console.log('   Создайте файл public/_redirects с содержимым: /* /index.html 200');
}

// Проверяем build директорию, если она существует
if (fs.existsSync(buildDir)) {
    console.log('✅ Директория build существует');

    if (fs.existsSync(buildRedirectsPath)) {
        console.log('✅ Файл _redirects существует в директории build');

        const buildRedirectsContent = fs.readFileSync(buildRedirectsPath, 'utf8');
        if (buildRedirectsContent.includes('/* /index.html 200')) {
            console.log('✅ Содержимое _redirects в build корректно');
        } else {
            console.log('❌ Содержимое _redirects в build некорректно');
            console.log('   Исправляем...');
            fs.writeFileSync(buildRedirectsPath, '/* /index.html 200');
            console.log('✅ _redirects в build исправлен');
        }
    } else {
        console.log('❌ Файл _redirects отсутствует в директории build');
        console.log('   Создаем...');
        fs.writeFileSync(buildRedirectsPath, '/* /index.html 200');
        console.log('✅ _redirects создан в директории build');
    }
}

console.log('\n🛠 Исправление возможных проблем...');

// Создаем _redirects в public, если его нет
if (!fs.existsSync(redirectsPath)) {
    console.log('📝 Создаем файл _redirects в public...');
    fs.writeFileSync(redirectsPath, '/* /index.html 200');
    console.log('✅ Файл _redirects создан в public');
}

// Создаем netlify.toml, если его нет
if (!fs.existsSync(netlifyTomlPath)) {
    console.log('📝 Создаем файл netlify.toml...');
    const netlifyTomlContent = `[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18.17.1"
  NPM_FLAGS = "--no-audit --legacy-peer-deps --force"
  CI = "true"

# Правила редиректов для SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
    fs.writeFileSync(netlifyTomlPath, netlifyTomlContent);
    console.log('✅ Файл netlify.toml создан');
}

console.log('\n✅ Проверка и исправление конфигурации Netlify завершены');
