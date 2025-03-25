import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { createTestUser } from '../utils/user';
import { getSearchingUsers, startSearching, stopSearching, triggerMatchmaking } from '../utils/matchmaking';
import { useNavigate } from 'react-router-dom';

export const TestChat = () => {
    const navigate = useNavigate();
    const [testUsers, setTestUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [searchingUsers, setSearchingUsers] = useState<any[]>([]);

    useEffect(() => {
        // Обновляем список пользователей в поиске каждую секунду
        const interval = setInterval(() => {
            const users = getSearchingUsers();
            setSearchingUsers(users);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const addLog = (message: string) => {
        setLogs(prev => [message, ...prev.slice(0, 49)]);
    };

    const createNewTestUser = () => {
        const name = `Тест${testUsers.length + 1}`;
        const user = createTestUser(name);
        if (user) {
            setTestUsers(prev => [...prev, user]);
            addLog(`Создан тестовый пользователь: ${name} (${user.id})`);
        } else {
            addLog('Ошибка при создании тестового пользователя');
        }
    };

    const startTestUserSearch = (userId: string) => {
        const success = startSearching(true, [], [0, 100]);
        if (success) {
            addLog(`Пользователь ${userId} начал поиск`);
        } else {
            addLog(`Ошибка при запуске поиска для ${userId}`);
        }
    };

    const stopTestUserSearch = (userId: string) => {
        const success = stopSearching(userId);
        if (success) {
            addLog(`Поиск остановлен для ${userId}`);
        } else {
            addLog(`Ошибка при остановке поиска для ${userId}`);
        }
    };

    const forceMatch = async () => {
        addLog('Запуск принудительного подбора пар...');
        const result = await triggerMatchmaking();
        addLog(`Результат: ${result ? 'Найдена пара' : 'Пара не найдена'}`);
    };

    const clearAllUsers = () => {
        setTestUsers([]);
        addLog('Список тестовых пользователей очищен');
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Отладка поиска собеседников</h1>

            <div className="flex gap-2 mb-4">
                <Button onClick={createNewTestUser} className="bg-blue-500 text-white">
                    Создать тестового пользователя
                </Button>
                <Button onClick={forceMatch} className="bg-green-500 text-white">
                    Запустить подбор пар
                </Button>
                <Button onClick={clearAllUsers} className="bg-red-500 text-white">
                    Очистить список
                </Button>
                <Button onClick={() => navigate('/')} className="bg-gray-500 text-white">
                    На главную
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <h2 className="text-xl font-bold mb-2">Тестовые пользователи ({testUsers.length})</h2>
                    <div className="divide-y">
                        {testUsers.map(user => (
                            <div key={user.id} className="py-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.id}</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => startTestUserSearch(user.id)}
                                            className="bg-green-500 text-white text-xs px-2 py-1"
                                        >
                                            Начать поиск
                                        </Button>
                                        <Button
                                            onClick={() => stopTestUserSearch(user.id)}
                                            className="bg-red-500 text-white text-xs px-2 py-1"
                                        >
                                            Остановить
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {testUsers.length === 0 && (
                            <div className="py-4 text-center text-gray-500">
                                Нет тестовых пользователей
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-4">
                    <h2 className="text-xl font-bold mb-2">Пользователи в поиске ({searchingUsers.length})</h2>
                    <div className="text-xs overflow-auto max-h-60">
                        <pre>{JSON.stringify(searchingUsers, null, 2)}</pre>
                    </div>
                </Card>

                <Card className="p-4 md:col-span-2">
                    <h2 className="text-xl font-bold mb-2">Логи</h2>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">{log}</div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TestChat;
