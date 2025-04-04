# Индексы Firebase для приложения

Для правильной работы приложения необходимо создать следующие составные индексы в Firebase Firestore.

## Индекс для поиска собеседника

Этот индекс требуется для функции поиска случайного собеседника.

### Коллекция: `searchQueue`

| Поле 1     | Поле 2      | Порядок   |
|------------|------------|-----------|
| userId     | Восходящий |           |
| timestamp  | Восходящий |           |

### Создание индекса

1. Откройте консоль Firebase по ссылке из ошибки: 
   ```
   https://console.firebase.google.com/v1/r/project/oleop-19cc2/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9vbGVvcC0xOWNjMi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc2VhcmNoUXVldWUv
   ```

2. Или создайте индекс вручную:
   - Откройте [Firebase Console](https://console.firebase.google.com/)
   - Выберите ваш проект
   - Перейдите в "Firestore Database" → "Indexes"
   - Нажмите "Create index"
   - Выберите коллекцию `searchQueue`
   - Добавьте поля `userId` и `timestamp` в восходящем порядке
   - Нажмите "Create"

3. Дождитесь создания индекса (может занять несколько минут)
