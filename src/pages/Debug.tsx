import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/user';
import { getSearchingUsers, triggerMatchmaking } from '../utils/matchmaking';
import { getChatById } from '../utils/chat'; // Импортируем getChatById из chat.ts

// Страница для отладки проблем с чатом
export const DebugPage = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [searchingUsers, setSearchingUsers] = useState<any[]>([]);
    const [storageInfo, setStorageInfo] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        try {
            // Получаем информацию о текущем пользователе
            const user = getCurrentUser();
            setUserInfo(user);

            // Получаем список пользователей в поиске
            const users = getSearchingUsers();
            setSearchingUsers(users);

            // Получаем информацию из localStorage
            const storageData: { [key: string]: any } = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    try {
                        const value = localStorage.getItem(key);
                        storageData[key] = value ? JSON.parse(value) : null;
                    } catch (e) {
                        storageData[key] = localStorage.getItem(key);
                    }
                }
            }
            setStorageInfo(storageData);

            addLog('Данные обновлены');
        } catch (error) {
            addLog(`Ошибка при обновлении данных: ${error}`);
        }
    };

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
    };

    const forceTriggerMatch = async () => {
        addLog('Запуск принудительного поиска совпадений...');
        try {
            const result = await triggerMatchmaking();
            addLog(`Результат поиска: ${result ? 'Найдено совпадение' : 'Совпадение не найдено'}`);
        } catch (error) {
            addLog(`Ошибка при поиске: ${error}`);
        }
    };

    const clearAllData = () => {
        if (window.confirm('Это действие удалит все данные приложения. Продолжить?')) {
            localStorage.clear();
            addLog('Все данные очищены');
            refreshData();
        }
    };

    const createTestUser = () => {
        try {
            // Создаем тестового пользователя для отладки
            const testUser = {
                id: `test_user_${Date.now()}`,
                name: 'Test User',
                interests: ['Test'],
                isAnonymous: true,
                rating: 5,
                createdAt: Date.now(),
                lastActive: Date.now()
            };

            // Сохраняем в localStorage
            const usersData = localStorage.getItem('users');
            const users = usersData ? JSON.parse(usersData) : [];
            users.push(testUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Добавляем в список поиска
            const searchingUsersData = localStorage.getItem('searching_users');
            const searchingUsers = searchingUsersData ? JSON.parse(searchingUsersData) : [];
            searchingUsers.push({
                userId: testUser.id,
                startedAt: Date.now(),
                preferences: { random: true }
            });
            localStorage.setItem('searching_users', JSON.stringify(searchingUsers));

            addLog(`Создан тестовый пользователь: ${testUser.id}`);
            refreshData();
        } catch (error) {
            addLog(`Ошибка при создании тестового пользователя: ${error}`);
        }
    };

    // Функция для полной очистки данных о поиске
    const resetSearchData = () => {
        try {
            localStorage.setItem('searching_users', JSON.stringify([]));
            addLog('Данные о поиске пользователей очищены');
            refreshData();
        } catch (error) {
            addLog(`Ошибка при очистке данных поиска: ${error}`);
        }
    };

    // Функция для очистки всех уведомлений о чатах
    const resetChatNotifications = () => {
        try {
            // Находим все ключи, связанные с уведомлениями о чатах
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('new_chat_notification_') || key.startsWith('new_chat_flag_'))) {
                    allKeys.push(key);
                }
            }

            // Удаляем найденные ключи
            allKeys.forEach(key => localStorage.removeItem(key));

            addLog(`Очищено ${allKeys.length} уведомлений о чатах`);
            refreshData();
        } catch (error) {
            addLog(`Ошибка при очистке уведомлений: ${error}`);
        }
    };

    // Проверка состояния уведомлений
    const checkNotifications = () => {
        try {
            const userId = userInfo?.id;
            if (!userId) {
                addLog('Нет текущего пользователя для проверки уведомлений');
                return;
            }

            const hasFlag = localStorage.getItem(`new_chat_flag_${userId}`) === 'true';
            const notificationData = localStorage.getItem(`new_chat_notification_${userId}`);

            addLog(`Флаг нового чата для ${userId}: ${hasFlag ? 'Установлен' : 'Отсутствует'}`);

            if (notificationData) {
                try {
                    const notification = JSON.parse(notificationData);
                    addLog(`Уведомление: chatId=${notification.chatId}, isRead=${notification.isRead}`);

                    // Проверяем существование чата
                    const chat = getChatById(notification.chatId);
                    if (chat) {
                        addLog('Чат существует!');
                    } else {
                        addLog('Чат не найден!');
                    }
                } catch (e) {
                    addLog(`Ошибка при парсинге уведомления: ${e}`);
                }
            } else {
                addLog('Данные уведомления отсутствуют');
            }
        } catch (error) {
            addLog(`Ошибка при проверке уведомлений: ${error}`);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Страница отладки</h1>

            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={refreshData}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Обновить данные
                </button>
                <button
                    onClick={forceTriggerMatch}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Принудительный поиск
                </button>
                <button
                    onClick={createTestUser}
                    className="px-4 py-2 bg-purple-500 text-white rounded"
                >
                    Создать тестового пользователя
                </button>
                <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-500 text-white rounded"
                >
                    Очистить все данные
                </button>
                <button
                    onClick={resetSearchData}
                    className="px-4 py-2 bg-orange-500 text-white rounded"
                >
                    Сбросить данные поиска
                </button>
                <button
                    onClick={resetChatNotifications}
                    className="px-4 py-2 bg-yellow-500 text-white rounded"
                >
                    Очистить уведомления
                </button>
                <button
                    onClick={checkNotifications}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Проверить уведомления
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-2">Текущий пользователь</h2>
                    <pre className="text-xs overflow-auto max-h-40">
                        {JSON.stringify(userInfo, null, 2)}
                    </pre>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-xl font-bold mb-2">Пользователи в поиске ({searchingUsers.length})</h2>
                    <pre className="text-xs overflow-auto max-h-40">
                        {JSON.stringify(searchingUsers, null, 2)}
                    </pre>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg md:col-span-2">
                    <h2 className="text-xl font-bold mb-2">Логи</h2>
                    <div className="text-xs font-mono bg-white p-2 rounded border max-h-40 overflow-auto">
                        {logs.map((log, index) => (
                            <div key={index} className="mb-1">{log}</div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg md:col-span-2">
                    <h2 className="text-xl font-bold mb-2">Данные localStorage</h2>
                    <div className="text-xs overflow-auto max-h-60">
                        {Object.entries(storageInfo).map(([key, value]) => (
                            <div key={key} className="mb-4">
                                <div className="font-bold">{key}:</div>
                                <pre className="pl-4 mt-1 bg-white p-1 rounded">
                                    {JSON.stringify(value, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugPage;

