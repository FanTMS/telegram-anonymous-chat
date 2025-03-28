import WebApp from '@twa-dev/sdk'
import { getCurrentUser, saveUser } from './user'

// Типы для магазина
export interface StoreItem {
  id: string;
  type: 'avatar' | 'sticker_pack' | 'emoji_pack' | 'premium_feature';
  name: string;
  description: string;
  price: number;
  image?: string;
  discount?: number; // скидка в процентах
  isPopular?: boolean;
  isNew?: boolean;
}

export interface AvatarItem extends StoreItem {
  type: 'avatar';
  avatarUrl: string;
  previewUrl: string;
  bgColor?: string;
}

export interface StickerPackItem extends StoreItem {
  type: 'sticker_pack';
  stickers: {
    id: string;
    url: string;
  }[];
}

export interface EmojiPackItem extends StoreItem {
  type: 'emoji_pack';
  emojis: string[];
}

export interface PremiumFeatureItem extends StoreItem {
  type: 'premium_feature';
  featureId: 'priority_search' | 'extended_profile' | 'advanced_filters' | 'ad_free' | 'custom_themes' | 'custom_feature';
  duration: number; // длительность в днях
  benefits: string[];
}

export type StoreItemUnion = AvatarItem | StickerPackItem | EmojiPackItem | PremiumFeatureItem;

// Интерфейс для покупки
export interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  purchaseDate: number;
  expiryDate?: number; // для премиум-функций
  isActive: boolean;
}

// Транзакция
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: number; // Unix timestamp
}

// Валюта
export interface Currency {
  balance: number;
  transactions: Transaction[];
}

// Аватары для магазина
const avatars: AvatarItem[] = [
  {
    id: 'avatar_1',
    type: 'avatar',
    name: 'Космический странник',
    description: 'Величественный космический путешественник с галактическим фоном',
    price: 100,
    avatarUrl: 'https://i.imgur.com/QgKvgZD.png',
    previewUrl: 'https://i.imgur.com/QgKvgZD.png',
    bgColor: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
    isPopular: true
  },
  {
    id: 'avatar_2',
    type: 'avatar',
    name: 'Киберпанк',
    description: 'Футуристический аватар в стиле киберпанк',
    price: 150,
    avatarUrl: 'https://i.imgur.com/8OiExGM.png',
    previewUrl: 'https://i.imgur.com/8OiExGM.png',
    bgColor: 'linear-gradient(135deg, #ff0099 0%, #493240 100%)',
    isNew: true
  },
  {
    id: 'avatar_3',
    type: 'avatar',
    name: 'Темный рыцарь',
    description: 'Таинственный аватар с мистической аурой',
    price: 120,
    avatarUrl: 'https://i.imgur.com/lqEen0A.png',
    previewUrl: 'https://i.imgur.com/lqEen0A.png',
    bgColor: 'linear-gradient(135deg, #434343 0%, #000000 100%)'
  },
  {
    id: 'avatar_4',
    type: 'avatar',
    name: 'Тропический рай',
    description: 'Яркий летний аватар для теплого настроения',
    price: 100,
    avatarUrl: 'https://i.imgur.com/a9V15KL.png',
    previewUrl: 'https://i.imgur.com/a9V15KL.png',
    bgColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  {
    id: 'avatar_5',
    type: 'avatar',
    name: 'Неоновый город',
    description: 'Аватар в стиле неоновых вывесок большого города',
    price: 130,
    avatarUrl: 'https://i.imgur.com/JkQXi8z.png',
    previewUrl: 'https://i.imgur.com/JkQXi8z.png',
    bgColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    discount: 15
  }
];

// Наборы стикеров
const stickerPacks: StickerPackItem[] = [
  {
    id: 'sticker_pack_1',
    type: 'sticker_pack',
    name: 'Милые животные',
    description: 'Коллекция очаровательных стикеров с животными',
    price: 80,
    image: 'https://i.imgur.com/RbCDEeF.png',
    stickers: [
      { id: 's1_1', url: 'https://i.imgur.com/QDJ92A2.png' },
      { id: 's1_2', url: 'https://i.imgur.com/0sCZyvN.png' },
      { id: 's1_3', url: 'https://i.imgur.com/0yOYLxJ.png' },
      { id: 's1_4', url: 'https://i.imgur.com/HHF5MqN.png' },
      { id: 's1_5', url: 'https://i.imgur.com/VLKk8wI.png' }
    ],
    isPopular: true
  },
  {
    id: 'sticker_pack_2',
    type: 'sticker_pack',
    name: 'Эмоции',
    description: 'Выражайте свои чувства с этими яркими стикерами',
    price: 75,
    image: 'https://i.imgur.com/2uF7qAB.png',
    stickers: [
      { id: 's2_1', url: 'https://i.imgur.com/AkF1wlE.png' },
      { id: 's2_2', url: 'https://i.imgur.com/SWU5GQp.png' },
      { id: 's2_3', url: 'https://i.imgur.com/M2Iomv2.png' },
      { id: 's2_4', url: 'https://i.imgur.com/lWpMSoz.png' },
      { id: 's2_5', url: 'https://i.imgur.com/jlqRZYK.png' }
    ]
  },
  {
    id: 'sticker_pack_3',
    type: 'sticker_pack',
    name: 'Кофейные приключения',
    description: 'Стикеры для любителей кофе и приятных бесед',
    price: 90,
    image: 'https://i.imgur.com/KMn9VZJ.png',
    stickers: [
      { id: 's3_1', url: 'https://i.imgur.com/wVJEpxG.png' },
      { id: 's3_2', url: 'https://i.imgur.com/uxQQvKb.png' },
      { id: 's3_3', url: 'https://i.imgur.com/SfJQMSk.png' },
      { id: 's3_4', url: 'https://i.imgur.com/7rVGUBn.png' },
      { id: 's3_5', url: 'https://i.imgur.com/LuJOy0r.png' }
    ],
    isNew: true
  }
];

// Наборы эмодзи
const emojiPacks: EmojiPackItem[] = [
  {
    id: 'emoji_pack_1',
    type: 'emoji_pack',
    name: 'Базовые эмоции',
    description: 'Набор эмодзи для выражения основных эмоций',
    price: 60,
    image: 'https://i.imgur.com/A7mJjQd.png',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
    isPopular: true
  },
  {
    id: 'emoji_pack_2',
    type: 'emoji_pack',
    name: 'Жесты и руки',
    description: 'Набор эмодзи-жестов для разнообразного общения',
    price: 50,
    image: 'https://i.imgur.com/2rPHLgp.png',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✍️']
  },
  {
    id: 'emoji_pack_3',
    type: 'emoji_pack',
    name: 'Сердечки и любовь',
    description: 'Романтический набор эмодзи для особых моментов',
    price: 70,
    image: 'https://i.imgur.com/qkRTKDq.png',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    isNew: true
  },
  {
    id: 'emoji_pack_4',
    type: 'emoji_pack',
    name: 'Вечеринка и праздник',
    description: 'Веселые эмодзи для праздничного настроения',
    price: 65,
    image: 'https://i.imgur.com/h47wSrV.png',
    emojis: ['🎉', '🎊', '🎈', '🎂', '🎁', '🎆', '🎇', '🧨', '✨', '🎐', '🎏', '🎎', '🎍', '🎋', '🎄', '🎃', '🎗️', '🎟️', '🎫'],
    discount: 15
  }
];

// Премиум-функции для магазина
const premiumFeatures: PremiumFeatureItem[] = [
  {
    id: 'premium_priority_search',
    type: 'premium_feature',
    featureId: 'priority_search',
    name: 'Приоритетный поиск',
    description: 'Ваши запросы на поиск собеседников будут обрабатываться в первую очередь',
    price: 200,
    duration: 30, // месяц
    image: 'https://i.imgur.com/ZyMf7R3.png',
    benefits: [
      'Быстрее находите собеседников',
      'Меньше времени ожидания в очереди',
      'Повышенный шанс найти идеального собеседника'
    ],
    isPopular: true
  },
  {
    id: 'premium_extended_profile',
    type: 'premium_feature',
    featureId: 'extended_profile',
    name: 'Расширенный профиль',
    description: 'Добавьте больше информации о себе и увидите больше деталей о других',
    price: 150,
    duration: 30, // месяц
    image: 'https://i.imgur.com/vPUcBWE.png',
    benefits: [
      'Более детальная информация о собеседниках',
      'Расширенные настройки профиля',
      'Дополнительные поля биографии'
    ]
  },
  {
    id: 'premium_advanced_filters',
    type: 'premium_feature',
    featureId: 'advanced_filters',
    name: 'Продвинутые фильтры',
    description: 'Используйте расширенные фильтры для поиска идеальных собеседников',
    price: 180,
    duration: 30, // месяц
    image: 'https://i.imgur.com/FVjEqF3.png',
    benefits: [
      'Поиск по конкретным интересам',
      'Фильтр по возрасту и городу',
      'Поиск по активности пользователей'
    ]
  },
  {
    id: 'premium_ad_free',
    type: 'premium_feature',
    featureId: 'ad_free',
    name: 'Режим без рекламы',
    description: 'Отключите все рекламные баннеры и наслаждайтесь чистым интерфейсом',
    price: 120,
    duration: 30, // месяц
    image: 'https://i.imgur.com/Gh7SQg.png',
    benefits: [
      'Никакой рекламы в чате и профиле',
      'Чистый и приятный интерфейс',
      'Больше места для важной информации'
    ],
    discount: 25,
    isNew: true
  },
  {
    id: 'premium_custom_themes',
    type: 'premium_feature',
    featureId: 'custom_themes',
    name: 'Пользовательские темы',
    description: 'Выбирайте из множества тем оформления или создайте свою собственную',
    price: 160,
    duration: 30, // месяц
    image: 'https://i.imgur.com/7JmFBsH.png',
    benefits: [
      'Доступ к эксклюзивным темам',
      'Настройка цветов интерфейса',
      'Возможность создания своих тем'
    ]
  }
];

// Все товары магазина объединены в один массив
export let allStoreItems: StoreItemUnion[] = [
  ...avatars,
  ...stickerPacks,
  ...emojiPacks,
  ...premiumFeatures
];

// Добавление нового товара в магазин
export const addStoreItem = (item: StoreItemUnion): void => {
  try {
    // Проверяем, есть ли товар с таким ID
    const existingItemIndex = allStoreItems.findIndex(i => i.id === item.id);
    if (existingItemIndex !== -1) {
      throw new Error(`Товар с ID ${item.id} уже существует`);
    }

    // Добавляем товар в массив
    allStoreItems.push(item);

    // Сохраняем обновленный список в localStorage
    saveStoreItems();

    return;
  } catch (error) {
    console.error('Ошибка при добавлении товара:', error);
    throw error;
  }
};

// Обновление существующего товара
export const updateStoreItem = (item: StoreItemUnion): void => {
  try {
    // Находим индекс обновляемого товара
    const itemIndex = allStoreItems.findIndex(i => i.id === item.id);
    if (itemIndex === -1) {
      throw new Error(`Товар с ID ${item.id} не найден`);
    }

    // Обновляем товар
    allStoreItems[itemIndex] = item;

    // Сохраняем обновленный список в localStorage
    saveStoreItems();

    return;
  } catch (error) {
    console.error('Ошибка при обновлении товара:', error);
    throw error;
  }
};

// Удаление товара из магазина
export const removeStoreItem = (itemId: string): void => {
  try {
    // Фильтруем список товаров, исключая товар с указанным ID
    const newItems = allStoreItems.filter(item => item.id !== itemId);

    // Если количество товаров не изменилось, значит товар не найден
    if (newItems.length === allStoreItems.length) {
      throw new Error(`Товар с ID ${itemId} не найден`);
    }

    // Обновляем список товаров
    allStoreItems = newItems;

    // Сохраняем обновленный список в localStorage
    saveStoreItems();

    return;
  } catch (error) {
    console.error('Ошибка при удалении товара:', error);
    throw error;
  }
};

// Сохранение списка товаров в localStorage
export const saveStoreItems = (): void => {
  try {
    localStorage.setItem('store_items', JSON.stringify(allStoreItems));
  } catch (error) {
    console.error('Ошибка при сохранении списка товаров:', error);
  }
};

// Загрузка списка товаров из localStorage
export const loadStoreItems = (): void => {
  try {
    const savedItems = localStorage.getItem('store_items');
    if (savedItems) {
      allStoreItems = JSON.parse(savedItems);
    }
  } catch (error) {
    console.error('Ошибка при загрузке списка товаров:', error);
  }
};

// Инициализация списка товаров при загрузке страницы
export const initializeStore = (): void => {
  try {
    // Проверяем, есть ли сохраненные товары
    const savedItems = localStorage.getItem('store_items');
    if (!savedItems) {
      // Если нет, сохраняем дефолтные товары
      saveStoreItems();
    } else {
      // Если есть, загружаем их
      loadStoreItems();
    }
  } catch (error) {
    console.error('Ошибка при инициализации магазина:', error);
  }
};

// Инициализируем магазин при импорте модуля
initializeStore();

// Получение баланса пользователя
export const getUserCurrency = (userId: string): Currency => {
  try {
    const key = `currency_${userId}`;
    const currencyData = localStorage.getItem(key);

    if (currencyData) {
      return JSON.parse(currencyData);
    }

    // Если данных нет, возвращаем начальное значение
    return {
      balance: 0,
      transactions: []
    };
  } catch (error) {
    console.error('Ошибка при получении валюты пользователя:', error);
    return {
      balance: 0,
      transactions: []
    };
  }
};

// Сохранение баланса пользователя
export const saveCurrency = (userId: string, currency: Currency): void => {
  try {
    localStorage.setItem(`currency_${userId}`, JSON.stringify(currency));
  } catch (error) {
    console.error('Ошибка при сохранении баланса:', error);
  }
};

// Добавление валюты пользователю
export const addCurrency = (userId: string, amount: number, description = 'Изменено администратором'): boolean => {
  try {
    const key = `currency_${userId}`;
    const currency: Currency = getUserCurrency(userId);

    // Добавляем или отнимаем указанную сумму
    currency.balance += amount;

    // Добавляем транзакцию в историю
    const transaction: Transaction = {
      id: `tr_${Date.now()}`,
      amount,
      description,
      date: Date.now()
    };
    currency.transactions.push(transaction);

    // Сохраняем обновленные данные
    localStorage.setItem(key, JSON.stringify(currency));

    return true;
  } catch (error) {
    console.error('Ошибка при обновлении баланса:', error);
    return false;
  }
}

// Списание валюты у пользователя
export const deductCurrency = (userId: string, amount: number, description: string): boolean => {
  try {
    const currency = getUserCurrency(userId);

    // Проверяем достаточно ли средств
    if (currency.balance < amount) {
      return false;
    }

    // Создаем новую транзакцию
    const transaction: Transaction = {
      id: `tr_${Date.now()}`,
      amount,
      description,
      date: Date.now()
    };

    // Обновляем баланс и список транзакций
    currency.balance -= amount;
    currency.transactions.push(transaction);

    // Сохраняем обновленные данные
    saveCurrency(userId, currency);

    return true;
  } catch (error) {
    console.error('Ошибка при списании валюты:', error);
    return false;
  }
};

// Получение покупок пользователя
export const getUserPurchases = (userId: string): Purchase[] => {
  try {
    const purchasesData = localStorage.getItem(`purchases_${userId}`);
    return purchasesData ? JSON.parse(purchasesData) : [];
  } catch (error) {
    console.error('Ошибка при получении покупок:', error);
    return [];
  }
};

// Сохранение покупок пользователя
export const savePurchases = (userId: string, purchases: Purchase[]): void => {
  try {
    localStorage.setItem(`purchases_${userId}`, JSON.stringify(purchases));
  } catch (error) {
    console.error('Ошибка при сохранении покупок:', error);
  }
};

// Проверка активности премиум-функции
export const isPremiumFeatureActive = (userId: string, featureId: string): boolean => {
  try {
    const purchases = getUserPurchases(userId);
    const now = Date.now();

    // Ищем активную подписку на премиум-функцию
    return purchases.some(purchase =>
      purchase.itemId === featureId &&
      purchase.isActive &&
      (!purchase.expiryDate || purchase.expiryDate > now)
    );
  } catch (error) {
    console.error('Ошибка при проверке премиум-функции:', error);
    return false;
  }
};

// Покупка товара
export const purchaseItem = (userId: string, itemId: string): boolean => {
  try {
    // Получаем данные пользователя, валюту и покупки
    const user = getCurrentUser();
    if (!user) return false;

    // Находим товар в магазине
    const item = allStoreItems.find(item => item.id === itemId);
    if (!item) return false;

    // Рассчитываем финальную цену с учетом скидки
    const finalPrice = item.discount
      ? Math.round(item.price * (1 - item.discount / 100))
      : item.price;

    // Списываем валюту
    const success = deductCurrency(userId, finalPrice, `Покупка: ${item.name}`);
    if (!success) return false;

    // Создаем новую покупку
    const purchase: Purchase = {
      id: `purchase_${Date.now()}`,
      userId,
      itemId: item.id,
      purchaseDate: Date.now(),
      isActive: true
    };

    // Для премиум-функций устанавливаем срок действия
    if (item.type === 'premium_feature') {
      purchase.expiryDate = Date.now() + item.duration * 24 * 60 * 60 * 1000;
    }

    // Сохраняем покупку в список покупок пользователя
    const purchases = getUserPurchases(userId);
    purchases.push(purchase);
    savePurchases(userId, purchases);

    // Если это аватар, устанавливаем его пользователю
    if (item.type === 'avatar') {
      user.avatar = (item as AvatarItem).avatarUrl;
      saveUser(user);
    }

    // Уведомляем пользователя о покупке через интерфейс Telegram
    WebApp.showAlert(`Покупка успешно совершена! ${item.name} теперь доступен в вашем профиле.`);

    return true;
  } catch (error) {
    console.error('Ошибка при покупке товара:', error);
    return false;
  }
};

// Получение скидочной цены (с учетом скидки)
export const getDiscountedPrice = (item: StoreItem): number => {
  if (!item.discount) return item.price;
  return Math.round(item.price * (1 - item.discount / 100));
};

// Проверка, куплен ли товар пользователем
export const isItemPurchased = (userId: string, itemId: string): boolean => {
  try {
    const purchases = getUserPurchases(userId);
    return purchases.some(purchase => purchase.itemId === itemId && purchase.isActive);
  } catch (error) {
    console.error('Ошибка при проверке покупки:', error);
    return false;
  }
};

// Получение всех активных премиум-функций пользователя
export const getActivePremiumFeatures = (userId: string): PremiumFeatureItem[] => {
  try {
    const purchases = getUserPurchases(userId);
    const now = Date.now();

    // Фильтруем покупки, чтобы получить только активные премиум-функции
    const activePremiumPurchases = purchases.filter(purchase =>
      purchase.isActive &&
      (!purchase.expiryDate || purchase.expiryDate > now)
    );

    // Находим соответствующие премиум-функции из списка всех товаров
    return premiumFeatures.filter(feature =>
      activePremiumPurchases.some(purchase => purchase.itemId === feature.id)
    );
  } catch (error) {
    console.error('Ошибка при получении активных премиум-функций:', error);
    return [];
  }
};

// Проверить и обновить срок действия премиум-функций
export const checkAndUpdatePremiumFeatures = (userId: string): void => {
  try {
    const purchases = getUserPurchases(userId);
    const now = Date.now();
    let updated = false;

    // Проходим по всем покупкам и обновляем статус активности
    purchases.forEach(purchase => {
      if (purchase.expiryDate && purchase.expiryDate < now && purchase.isActive) {
        purchase.isActive = false;
        updated = true;
      }
    });

    // Если были изменения, сохраняем обновленные покупки
    if (updated) {
      savePurchases(userId, purchases);
    }
  } catch (error) {
    console.error('Ошибка при обновлении премиум-функций:', error);
  }
};

// Добавление бонусной валюты
export const addBonusCurrency = (userId: string, amount: number): boolean => {
  try {
    const currency = getUserCurrency(userId);

    // Создаем новую транзакцию
    const transaction: Transaction = {
      id: `tr_${Date.now()}`,
      amount,
      description: 'Бонус за активность',
      date: Date.now()
    };

    // Обновляем баланс и список транзакций
    currency.balance += amount;
    currency.transactions.push(transaction);

    // Сохраняем обновленные данные
    localStorage.setItem(`currency_${userId}`, JSON.stringify(currency));

    return true;
  } catch (error) {
    console.error('Ошибка при добавлении бонуса:', error);
    return false;
  }
};
