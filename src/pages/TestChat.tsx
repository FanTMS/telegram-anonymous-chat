import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getCurrentUser } from '../utils/user';
import { getChatById, saveChat } from '../utils/chat';
import { useNotifications } from '../utils/notifications';

// Создаем тестовый идентификатор
const TEST_CHAT_ID = 'test_chat_' + Date.now();

const TestChat: React.FC = () => {
    const navigate = useNavigate();
    const notifications = useNotifications();
    const [chatExists, setChatExists] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    // Добавление записи в лог
    const addLog = (message: string) => {
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    // Проверка существования тестового чата
    useEffect(() => {
        const checkTestChat = () => {
            try {
                const chat = getChatById(TEST_CHAT_ID);
                setChatExists(!!chat);
                if (chat) {
                    addLog(`Найден тестовый чат: ${chat.id}`);
                } else {
                    addLog('Тестовый чат не найден');
                }
            } catch (error) {
                console.error('Ошибка при проверке тестового чата:', error);
                setError('Ошибка при проверке чата');
            } finally {
                setLoading(false);
            }
        };

        checkTestChat();
    }, []);

    // Создание тестового чата
    const handleCreateChat = () => {
        try {
            const currentUser = getCurrentUser();

            if (!currentUser) {
                addLog('Ошибка: пользователь не найден');
                setError('Пользователь не найден');
                notifications.showError('Пользователь не найден');
                return;
            }

            // Создаем партнера для чата
            const partnerId = 'test_partner_' + Date.now();

            // Создаем тестовый чат
            const testChat = {
                id: TEST_CHAT_ID,
                participants: [currentUser.id, partnerId],
                messages: [
                    {
                        id: 'msg_1',
                        chatId: TEST_CHAT_ID,
                        senderId: partnerId,
                        text: 'Привет! Это тестовое сообщение.',
                        timestamp: Date.now(),
                        isRead: false,
                        senderName: 'Тестовый собеседник'
                    }
                ],
                isActive: true,
                startedAt: Date.now(),
                userId: currentUser.id,
                partnerId: partnerId,
                createdAt: new Date(),
                lastActivity: new Date(),
                isArchived: false,
                lastMessageText: 'Привет! Это тестовое сообщение.',
                // Добавляем отсутствующее свойство
                ended: false
            };

            // Сохраняем чат
            const success = saveChat(testChat);

            if (success) {
                addLog(`Тестовый чат ${TEST_CHAT_ID} успешно создан`);
                setChatExists(true);
                notifications.showSuccess('Тестовый чат создан');
            } else {
                addLog('Ошибка при создании тестового чата');
                setError('Не удалось создать чат');
                notifications.showError('Не удалось создать чат');
            }
        } catch (error) {
            console.error('Ошибка при создании тестового чата:', error);
            addLog(`Ошибка: ${error}`);
            setError('Ошибка при создании чата');
            notifications.showError('Ошибка при создании чата');
        }
    };

    // Переход в созданный тестовый чат
    const handleGoToChat = () => {
        navigate(`/chat/${TEST_CHAT_ID}`);
    };

    // Отправка события о новом чате
    const handleTriggerChatEvent = () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                addLog('Пользователь не найден');
                return;
            }

            const chatEvent = new CustomEvent('chatFound', {
                detail: {
                    chatId: TEST_CHAT_ID,
                    participants: [user.id, 'test_partner'],
                    timestamp: Date.now(),
                    userId: user.id
                }
            });

            window.dispatchEvent(chatEvent);
            addLog('Событие chatFound отправлено');
            notifications.showInfo('Событие отправлено');
        } catch (error) {
            console.error('Ошибка при отправке события:', error);
            addLog(`Ошибка при отправке события: ${error}`);
        }
    };

    // Удаление тестового чата
    const handleResetChat = () => {
        try {
            // Очистка связанных данных из localStorage
            const keys = Object.keys(localStorage).filter(key =>
                key.includes(TEST_CHAT_ID) ||
                key.startsWith('new_chat_') ||
                key.includes('test_chat_')
            );

            keys.forEach(key => {
                localStorage.removeItem(key);
                addLog(`Удален ключ: ${key}`);
            });

            setChatExists(false);
            addLog('Тестовый чат сброшен');
            notifications.showSuccess('Тестовый чат удален');
        } catch (error) {
            console.error('Ошибка при сбросе чата:', error);
            addLog(`Ошибка при сбросе: ${error}`);
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">Тестовый чат</h1>
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 mb-20">
            <h1 className="text-xl font-bold mb-4">Тестовый чат</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{error}</p>
                </div>
            )}

            <Card className="p-4 mb-4">
                <h2 className="font-bold mb-2">Статус тестового чата</h2>
                <p className="mb-3">
                    ID тестового чата: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{TEST_CHAT_ID}</code>
                </p>
                <p className="mb-4">
                    Статус: {chatExists ? (
                        <span className="text-green-600 font-bold">Существует</span>
                    ) : (
                        <span className="text-red-600 font-bold">Не существует</span>
                    )}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {!chatExists ? (
                        <Button onClick={handleCreateChat}>Создать тестовый чат</Button>
                    ) : (
                        <Button onClick={handleGoToChat}>Перейти в чат</Button>
                    )}

                    <Button
                        onClick={handleResetChat}
                        variant="outline"
                        className="border-red-500 text-red-500"
                    >
                        Сбросить чат
                    </Button>
                </div>

                <Button
                    onClick={handleTriggerChatEvent}
                    variant="secondary"
                    fullWidth
                >
                    Отправить событие chatFound
                </Button>
            </Card>

            <Card className="p-4">
                <h2 className="font-bold mb-2">Журнал действий</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded max-h-60 overflow-y-auto">
                    {log.length > 0 ? (
                        <ul className="text-xs font-mono">
                            {log.map((entry, index) => (
                                <li key={index} className="mb-1">{entry}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm italic">Журнал пуст</p>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TestChat;
