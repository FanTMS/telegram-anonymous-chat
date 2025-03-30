import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/user';
import { getSearchingUsers, triggerMatchmaking } from '../utils/matchmaking';
import { getChatById } from '../utils/chat';
import { testMongoDBConnection } from '../utils/test-mongodb';
import { checkMongoDbConnection } from '../utils/dbService';

// Определим компонент Card, если он отсутствует в импортах
const Card: React.FC<{ className?: string, children: React.ReactNode }> = ({ className = '', children }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
        {children}
    </div>
);

// Определим компонент Button, если он отсутствует в импортах
interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    fullWidth?: boolean;
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
    onClick,
    children,
    disabled = false,
    variant = 'primary',
    fullWidth = false,
    className = '',
    size = 'medium'
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors';

    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
        outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
    };

    const sizeClasses = {
        small: 'text-xs py-1 px-2',
        medium: 'text-sm py-2 px-4',
        large: 'text-base py-3 px-6'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
        >
            {children}
        </button>
    );
};

// Определим тип для результата getSearchingUsers
interface SearchingUser {
    userId: string;
    startedAt: number;
    preferences: {
        random: boolean;
        interests?: string[];
        ageRange?: [number, number];
        specificUserId?: string;
    };
}

export const DebugPage = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [searchingUsers, setSearchingUsers] = useState<any[]>([]);
    const [storageInfo, setStorageInfo] = useState<{ [key: string]: any }>({});
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [mongoUri, setMongoUri] = useState<string | null>(null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            // Получаем информацию о текущем пользователе
            const user = await getCurrentUser();
            setUserInfo(user);

            // Получаем список пользователей в поиске - исправляем ошибку TS2345
            const users = await getSearchingUsers();
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
    const checkNotifications = async () => {
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
                    const chat = await getChatById(notification.chatId);
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

    const handleTestConnection = async () => {
        try {
            setTestStatus('loading');
            setTestResult(null);

            const result = await testMongoDBConnection();

            if (result) {
                setTestStatus('success');
                setTestResult('✅ Подключение к MongoDB работает корректно!');
            } else {
                setTestStatus('error');
                setTestResult('❌ Не удалось подключиться к MongoDB. Проверьте консоль для подробностей.');
            }
        } catch (error) {
            setTestStatus('error');
            setTestResult(`❌ Ошибка при тестировании: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Debug test error:', error);
        }
    };

    const handleCheckConnection = async () => {
        try {
            setIsChecking(true);
            const isConnected = await checkMongoDbConnection();
            setConnectionStatus(isConnected);
        } catch (error) {
            console.error('Error checking connection:', error);
            setConnectionStatus(false);
        } finally {
            setIsChecking(false);
        }
    };

    const getUserInfo = async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                setUserId(user.id);
            } else {
                setUserId('Пользователь не найден');
            }
        } catch (error) {
            console.error('Error getting user:', error);
            setUserId('Ошибка получения пользователя');
        }
    };

    // Получаем URI из переменных окружения (работает только в режиме разработки)
    const getMongoUri = () => {
        try {
            const uri = import.meta.env.VITE_MONGODB_URI || 'Не установлен';
            setMongoUri(uri);
        } catch (error) {
            console.error('Error getting MongoDB URI:', error);
            setMongoUri('Ошибка получения URI');
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

            <div className="p-4 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Отладка подключения к базе данных</h1>

                <Card className="p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-3">Проверка соединения с MongoDB</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Этот инструмент проверяет соединение с MongoDB путем выполнения тестовых операций чтения и записи.
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={handleTestConnection}
                            disabled={testStatus === 'loading'}
                            fullWidth
                            variant="primary"
                        >
                            {testStatus === 'loading' ? 'Проверка...' : 'Тестировать соединение с MongoDB'}
                        </Button>

                        {testResult && (
                            <div className={`p-3 rounded-lg ${testStatus === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                {testResult}
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-3">Быстрая проверка через dbService</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Проверка соединения через стандартный метод приложения.
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={handleCheckConnection}
                            disabled={isChecking}
                            fullWidth
                            variant="outline"
                        >
                            {isChecking ? 'Проверка...' : 'Проверить соединение'}
                        </Button>

                        {connectionStatus !== null && (
                            <div className={`p-3 rounded-lg ${connectionStatus ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                {connectionStatus ? '✅ Соединение с MongoDB установлено' : '❌ Соединение с MongoDB отсутствует'}
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-4 mb-6">
                    <h2 className="text-lg font-semibold mb-3">Информация о пользователе</h2>
                    <Button
                        onClick={getUserInfo}
                        fullWidth
                        variant="secondary"
                        className="mb-3"
                    >
                        Получить ID текущего пользователя
                    </Button>

                    {userId && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p><strong>ID пользователя:</strong> {userId}</p>
                        </div>
                    )}
                </Card>

                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-3">Информация о подключении</h2>
                    <Button
                        onClick={getMongoUri}
                        fullWidth
                        variant="secondary"
                        className="mb-3"
                    >
                        Показать MongoDB URI
                    </Button>

                    {mongoUri && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p><strong>MongoDB URI:</strong> {mongoUri.substring(0, 20)}...</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default DebugPage;

