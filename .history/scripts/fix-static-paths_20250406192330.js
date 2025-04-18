/**
 * Скрипт для исправления путей к статическим ресурсам
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка и исправление путей к статическим ресурсам...');

// Функция для исправления путей в index.html
const fixIndexPaths = () => {
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Файл index.html не найден!');
    return false;
  }
  
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Проверяем наличие переменной PUBLIC_URL
  if (content.includes('%PUBLIC_URL%')) {
    console.log('✅ Ссылки на статические ресурсы в index.html настроены правильно');
    return true;
  }
  
  // Заменяем относительные пути на %PUBLIC_URL%
  content = content.replace(/href="\/favicon.ico"/g, 'href="%PUBLIC_URL%/favicon.ico"');
  content = content.replace(/href="\/logo192.png"/g, 'href="%PUBLIC_URL%/logo192.png"');
  content = content.replace(/href="\/manifest.json"/g, 'href="%PUBLIC_URL%/manifest.json"');
  
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('✅ Пути в index.html исправлены');
  return true;
};

// Функция для исправления путей в манифесте
const fixManifestPaths = () => {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Файл manifest.json не найден!');
    return false;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Проверяем и исправляем start_url
    if (manifest.start_url !== '.') {
      manifest.start_url = '.';
      console.log('✅ Исправлен start_url в manifest.json');
    }
    
    // Проверяем и исправляем пути к иконкам
    manifest.icons.forEach(icon => {
      if (icon.src.startsWith('/')) {
        icon.src = icon.src.substring(1);
        console.log(`✅ Исправлен путь к иконке: ${icon.src}`);
      }
    });
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('✅ Пути в manifest.json исправлены');
    return true;
  } catch (error) {
    console.error('❌ Ошибка при обработке manifest.json:', error);
    return false;
  }
};

// Проверяем наличие необходимых статических файлов
const checkStaticFiles = () => {
  const publicDir = path.join(__dirname, '..', 'public');
  const requiredFiles = ['favicon.ico', 'logo192.png', 'logo512.png', 'manifest.json'];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(publicDir, file)));
  
  if (missingFiles.length > 0) {
    console.error(`❌ Отсутствуют следующие статические файлы: ${missingFiles.join(', ')}`);
    console.log('🔍 Запускаем скрипт создания логотипов...');
    
    try {
      require('./create-logo');
      console.log('✅ Логотипы успешно созданы');
    } catch (error) {
      console.error('❌ Ошибка при создании логотипов:', error);
    }
  } else {
    console.log('✅ Все необходимые статические файлы присутствуют');
  }
};

// Создание .env файла, если он не существует
const createEnvFile = () => {
  const envPath = path.join(__dirname, '..', '.env');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  
  // Если .env.local существует, используем его
  if (fs.existsSync(envLocalPath)) {
    console.log('✅ Файл .env.local найден');
    return;
  }
  
  // Если .env не существует, создаем его
  if (!fs.existsSync(envPath)) {
    const envContent = `
# Переменные окружения для React-приложения
REACT_APP_PUBLIC_URL=
PUBLIC_URL=
    `;
    
    fs.writeFileSync(envPath, envContent.trim(), 'utf8');
    console.log('✅ Создан файл .env с настройками PUBLIC_URL');
  } else {
    // Если .env существует, проверяем наличие PUBLIC_URL
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (!envContent.includes('PUBLIC_URL=')) {
      envContent += '\nPUBLIC_URL=\n';
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('✅ Добавлена переменная PUBLIC_URL в файл .env');
    }
  }
};

// Запуск всех проверок и исправлений
checkStaticFiles();
fixIndexPaths();
fixManifestPaths();
createEnvFile();

console.log('✅ Проверка и исправление путей к статическим ресурсам завершена');
