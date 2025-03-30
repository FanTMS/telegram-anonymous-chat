# Телеграм Анонимный Чат с MongoDB

Приложение для анонимного общения через Telegram Mini App с использованием MongoDB в качестве базы данных.

## Описание

Этот проект представляет собой веб-приложение, которое позволяет пользователям общаться анонимно через Telegram.

## Настройка MongoDB

1. Создайте бесплатный аккаунт на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Создайте новый кластер (бесплатный M0 подходит для начала)
3. Настройте Network Access, добавив ваш IP адрес или `0.0.0.0/0` для доступа отовсюду
4. Создайте пользователя базы данных (Database User) для подключения
5. Получите строку подключения (Connection String) для вашего кластера

## Установка и запуск

### Предварительные требования

- Node.js (версия 18 или выше)
- npm (версия 9 или выше)

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/ваш-username/telegram-anonymous-chat.git
cd telegram-anonymous-chat

# Установка зависимостей
npm install
```

### Локальная разработка

1. Установите зависимости проекта:
   ```
   npm install
   ```

2. Создайте файл `.env` в корневой директории проекта со следующим содержанием:
   ```
   MONGODB_URI=ваша_строка_подключения_mongodb
   ```

3. Запустите сервер разработки с поддержкой Netlify Functions:
   ```
   npx netlify dev
   ```

4. Приложение будет доступно по адресу `http://localhost:5173`

### Сборка

```bash
npm run build
```

## Структура базы данных

MongoDB автоматически создает коллекции по мере необходимости. В проекте используются следующие:

- `users` - пользователи приложения
- `chats` - чаты между пользователями
- `messages` - сообщения в чатах
- `groups` - групповые чаты
- `group_members` - участники групповых чатов
- `group_messages` - сообщения в групповых чатах
- `settings` - настройки пользователей и системы
- `moderation_history` - история модерации

## Деплой

### Настройка Netlify

1. Создайте аккаунт на [Netlify](https://app.netlify.com/signup)
2. Импортируйте проект из вашего Git-репозитория или загрузите папку с проектом
3. В настройках проекта (Site settings) перейдите в раздел Environment variables
4. Добавьте переменную окружения `MONGODB_URI` с вашей строкой подключения MongoDB
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telegram-anonymous-chat?retryWrites=true&w=majority
   ```

Проект настроен для деплоя на Netlify. Конфигурация указана в файле `netlify.toml`.

## Отладка

Для отладки Netlify Functions используйте:
```
npx netlify functions:invoke mongodb --payload '{"operation": "getAll", "collection": "users"}'
```

## Тестирование интеграции с Telegram Mini Apps

1. Запустите локальный сервер: `npx netlify dev`
2. Используйте [Telegram Bot Father](https://t.me/BotFather) для создания или обновления вашего бота
3. Для тестирования используйте команду `/newapp` и укажите адрес вашего локального сервера или развернутого на Netlify

## Лицензия

Этот проект лицензирован по [MIT License](LICENSE).
