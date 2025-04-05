# Коллекции Firebase для приложения анонимного чата

Для корректной работы приложения необходимо создать следующие коллекции в Firebase Firestore:

1. **users** - Хранит информацию о пользователях
   - Поля: name, age, interests, aboutMe, telegramId, registrationDate, lastActive

2. **chats** - Хранит информацию о чатах между пользователями
   - Поля: participants (массив ID пользователей), messages (массив сообщений), createdAt, lastMessageAt

3. **searchQueue** - Хранит очередь поиска собеседников
   - Поля: userId, timestamp

4. **test_users** - Используется для тестирования
   - Поля: различные тестовые данные пользователей

## Создание коллекций

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. В левом меню выберите "Firestore Database"
4. Нажмите "Create database" если база данных ещё не создана
5. Выберите "Start in production mode" и подходящий регион
6. Нажмите "Create collection" и создайте перечисленные выше коллекции

## Правила безопасности

Обновите правила безопасности Firestore для вашего приложения:

