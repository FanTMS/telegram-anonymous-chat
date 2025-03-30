import WebApp from '@twa-dev/sdk'
import { User, saveUser, getCurrentUser, getUserByTelegramId, setCurrentUser } from './user'
import { storageAPI } from './storage-wrapper'

// Интерфейс для пользователя Telegram
interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

// Проверка, запущено ли приложение в окружении Telegram
export const isInTelegram = (): boolean => {
  return WebApp.isExpanded !== undefined
}

// Получение данных пользователя из Telegram
export const getTelegramUser = (): TelegramUser | null => {
  try {
    // Проверяем, запущено ли приложение в Telegram
    if (!isInTelegram()) {
      console.log('Приложение не запущено в окружении Telegram')
      return null
    }

    // Получаем данные пользователя
    const user = WebApp.initDataUnsafe?.user

    if (!user) {
      console.log('Данные пользователя не найдены')
      return null
    }

    return user
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из Telegram:', error)
    return null
  }
}

// Создание или обновление пользователя на основе данных из Telegram
export const initializeUserFromTelegram = (): User | null => {
  try {
    // Получаем данные пользователя из Telegram
    const telegramUser = getTelegramUser()
    if (!telegramUser) {
      console.log('Не удалось получить данные пользователя из Telegram')
      return null
    }

    const telegramId = telegramUser.id.toString();
    console.log(`Инициализация пользователя из Telegram с ID: ${telegramId}`);

    // Ищем пользователя по Telegram ID в локальном хранилище более эффективно
    const existingUser = getUserByTelegramId(telegramId);

    if (existingUser) {
      // Пользователь существует, обновляем время последней активности
      console.log(`Найден существующий пользователь: ${existingUser.name} (ID: ${existingUser.id})`);
      existingUser.lastActive = Date.now();

      // Проверяем, нужно ли обновить какие-либо данные
      if (!existingUser.telegramData) {
        existingUser.telegramData = {
          telegramId: telegramId,
          authDate: Date.now()
        };
      }

      // Обновляем данные Telegram, только если они изменились
      let dataChanged = false;

      if (existingUser.telegramData.username !== telegramUser.username) {
        existingUser.telegramData.username = telegramUser.username;
        dataChanged = true;
      }

      if (existingUser.telegramData.firstName !== telegramUser.first_name) {
        existingUser.telegramData.firstName = telegramUser.first_name;
        dataChanged = true;
      }

      if (existingUser.telegramData.lastName !== telegramUser.last_name) {
        existingUser.telegramData.lastName = telegramUser.last_name;
        dataChanged = true;
      }

      if (existingUser.telegramData.photoUrl !== telegramUser.photo_url) {
        existingUser.telegramData.photoUrl = telegramUser.photo_url;
        dataChanged = true;
      }

      // Обновляем локальное хранилище только если данные изменились или прошло время
      if (dataChanged || Date.now() - existingUser.lastActive > 3600000) { // 1 час
        saveUser(existingUser);
        console.log(`Данные пользователя с Telegram ID ${telegramId} обновлены`);
      }

      // Устанавливаем как текущего пользователя
      setCurrentUser(existingUser.id);

      return existingUser;
    } else {
      // Создаем нового пользователя с более уникальным ID
      const userId = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const newUser: User = {
        id: userId,
        name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : ''),
        age: null, // Пользователь сможет установить позже
        isAnonymous: false,
        interests: [],
        rating: 0,
        createdAt: Date.now(),
        lastActive: Date.now(),
        verified: true, // Пользователь верифицирован через Telegram
        telegramData: {
          telegramId: telegramId,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          photoUrl: telegramUser.photo_url,
          languageCode: telegramUser.language_code,
          authDate: Date.now()
        },
        currentUser: null,
        existingUserByTelegramId: null
      };

      // Сохраняем нового пользователя
      saveUser(newUser);

      // Устанавливаем как текущего пользователя
      setCurrentUser(userId);

      console.log(`Создан новый пользователь с Telegram ID ${telegramId}: ${newUser.name} (ID: ${userId})`);

      // Также добавляем в список пользователей для быстрого поиска
      try {
        const usersData = storageAPI.getItem('users');
        const users = usersData ? JSON.parse(usersData) : [];
        users.push(newUser);
        storageAPI.setItem('users', JSON.stringify(users));
      } catch (err) {
        console.error('Ошибка при добавлении пользователя в общий список:', err);
      }

      return newUser;
    }
  } catch (error) {
    console.error('Ошибка при инициализации пользователя из Telegram:', error);
    return null;
  }
}

// Проверка, является ли пользователь авторизованным через Telegram
export const isTelegramUser = (user: User | null): boolean => {
  return user !== null && !!user.telegramData?.telegramId
}

// Уведомить пользователя через нативный интерфейс Telegram
export const notifyUser = (message: string): void => {
  WebApp.showPopup({
    title: 'Уведомление',
    message,
    buttons: [{ type: 'ok' }]
  })
}

// Закрыть приложение Telegram Web App
export const closeApp = (): void => {
  WebApp.close()
}
