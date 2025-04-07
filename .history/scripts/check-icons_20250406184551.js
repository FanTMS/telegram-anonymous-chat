const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

/**
 * Проверяет наличие иконок приложения и создает их, если они отсутствуют
 */
function checkAndCreateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const icons = [
    { name: 'logo192.png', size: 192 },
    { name: 'logo512.png', size: 512 },
    { name: 'favicon.ico', size: 64 }
  ];
  
  icons.forEach(icon => {
    const iconPath = path.join(publicDir, icon.name);
    
    if (!fs.existsSync(iconPath)) {
      console.log(`Создание отсутствующей иконки: ${icon.name}`);
      
      if (icon.name === 'favicon.ico') {
        // Для favicon используем специальную библиотеку или копируем существующий
        console.log('Предупреждение: favicon.ico должен быть создан вручную');
      } else {
        // Создаем PNG иконку
        createPngIcon(iconPath, icon.size);
      }
    } else {
      console.log(`Иконка ${icon.name} существует`);
    }
  });
}

/**
 * Создает PNG-иконку с заданным размером
 * @param {string} filePath - Путь для сохранения иконки
 * @param {number} size - Размер иконки в пикселях
 */
function createPngIcon(filePath, size) {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Заполняем фон
    ctx.fillStyle = '#3390ec'; // Цвет Telegram
    ctx.fillRect(0, 0, size, size);
    
    // Рисуем простую букву T в центре
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', size / 2, size / 2);
    
    // Сохраняем в файл
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Создана иконка ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Ошибка при создании иконки ${path.basename(filePath)}:`, error);
  }
}

// Запускаем проверку иконок
checkAndCreateIcons();
