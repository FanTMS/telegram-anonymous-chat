const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

/**
 * Создает иконку приложения для манифеста
 */
const createLogo = (size) => {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Фон (цвет Telegram)
    ctx.fillStyle = '#0088cc';
    ctx.fillRect(0, 0, size, size);

    // Белый круг в центре
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, Math.PI * 2, true);
    ctx.fill();

    // Буква 'А' в центре (можно изменить на другую букву)
    ctx.fillStyle = '#0088cc';
    ctx.font = `bold ${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', size/2, size/2);

    // Сохраняем в файл
    const buffer = canvas.toBuffer('image/png');
    const logoPath = path.join(__dirname, '..', 'public', `logo${size}.png`);
    fs.writeFileSync(logoPath, buffer);
    console.log(`✅ Иконка logo${size}.png создана успешно`);
    
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при создании иконки logo${size}.png:`, error);
    return false;
  }
};

// Создаем иконки разных размеров
const createLogos = () => {
  createLogo(192);
  createLogo(512);
  
  // Создаем также favicon.ico простой заменой
  try {
    const logo192Path = path.join(__dirname, '..', 'public', 'logo192.png');
    const faviconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    
    // Просто копируем logo192.png как favicon.ico
    // Это не лучшее решение, но для тестовой среды подойдёт
    if (fs.existsSync(logo192Path)) {
      fs.copyFileSync(logo192Path, faviconPath);
      console.log('✅ favicon.ico создан успешно (копия logo192.png)');
    }
  } catch (faviconError) {
    console.error('❌ Ошибка при создании favicon.ico:', faviconError);
  }
};

createLogos();

// Этот скрипт зависит от пакета canvas, добавьте его в package.json:
// "devDependencies": {
//   "canvas": "^2.9.0"
// }
