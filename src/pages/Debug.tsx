import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { debugUtils } from '../utils/debug';
import { getCurrentUser, saveUser } from '../utils/user';
import { userStorage } from '../utils/userStorage';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const DebugPage: React.FC = () => {
    const navigate = useNavigate();
    const [log, setLog] = useState<string>('');
    const [userStorageInitialized, setUserStorageInitialized] = useState(userStorage.isInitialized());

    const addToLog = (message: string) => {
        setLog(prev => `${message}\n${prev}`);
    };

    const handleRunDiagnostics = () => {
        try {
            addToLog('Запуск диагностики...');
            debugUtils.runFullDebug();
            addToLog('Диагностика завершена, проверьте консоль браузера');
        } catch (error) {
            addToLog(`Ошибка диагностики: ${error}`);
        }
    };

    const handleResetUserData = () => {
        try {
            const confirmed = window.confirm('Вы уверены, что хотите сбросить все данные пользователя?');
            if (!confirmed) return;

            const success = debugUtils.resetUserData();
            if (success) {
                addToLog('Данные пользователя успешно сброшены');
                setUserStorageInitialized(false);
            } else {
                addToLog('Не удалось сбросить данные пользователя');
            }
        } catch (error) {
            addToLog(`Ошибка при сбросе данных: ${error}`);
        }
    };

    const handleTestTelegramApi = () => {
        try {
            if (typeof WebApp === 'undefined') {
                addToLog('Telegram WebApp API не доступен');
                return;
            }

            WebApp.showPopup({
                title: 'Тестовое сообщение',
                message: 'Это тестовое сообщение Telegram WebApp API',
                buttons: [
                    { type: 'ok' },
                    { type: 'cancel' }
                ]
            });

            addToLog('Тестовое сообщение отправлено');
        } catch (error) {
            addToLog(`Ошибка при тестировании Telegram API: ${error}`);
        }
    };

    const handleFixRegistration = () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                addToLog('Пользователь не найден');
                return;
            }

            // Фиксируем обязательные поля
            if (!user.age) user.age = 25;
            if (!user.interests || !user.interests.length) {
                user.interests = ['Музыка', 'Кино', 'Путешествия'];
            }
            if (!user.name) user.name = 'Пользователь';

            // Исправляем дату активности
            user.lastActive = Date.now();

            // Сохраняем исправленного пользователя
            saveUser(user);

            addToLog(`Регистрация пользователя исправлена: ${JSON.stringify({
                id: user.id,
                name: user.name,
                age: user.age,
                interests: user.interests
            })}`);
        } catch (error) {
            addToLog(`Ошибка при исправлении регистрации: ${error}`);
        }
    };

    const handleTestNavigation = () => {
        try {
            addToLog('Проверка навигации...');

            // Тестируем навигацию туда-обратно
            setTimeout(() => {
                navigate('/');

                setTimeout(() => {
                    navigate('/debug');
                    addToLog('Тест навигации завершен');
                }, 1000);
            }, 1000);
        } catch (error) {
            addToLog(`Ошибка при тестировании навигации: ${error}`);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Инструменты отладки</h1>

            <div className="grid gap-4 mb-6">
                <Card className="p-4">
                    <h2 className="font-bold mb-2">Диагностика</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleRunDiagnostics}>Запустить диагностику</Button>
                        <Button onClick={debugUtils.logWebAppInfo} variant="secondary">Инфо о WebApp</Button>
                    </div>
                </Card>

                <Card className="p-4">
                    <h2 className="font-bold mb-2">Пользовательские данные</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleFixRegistration}>Исправить регистрацию</Button>
                        <Button onClick={handleResetUserData} variant="outline" className="border-red-500 text-red-500">
                            Сбросить данные
                        </Button>
                    </div>
                    <div className="mt-2">
                        <p className="text-sm">
                            UserStorage инициализировано: {userStorageInitialized ? 'Да' : 'Нет'}
                        </p>
                        <p className="text-sm">
                            Текущий пользователь: {getCurrentUser()?.id || 'Не определен'}
                        </p>
                    </div>
                </Card>

                <Card className="p-4">
                    <h2 className="font-bold mb-2">Telegram API</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleTestTelegramApi}>Тест WebApp API</Button>
                        <Button onClick={handleTestNavigation} variant="secondary">Тест навигации</Button>
                    </div>
                </Card>
            </div>

            <Card className="p-4">
                <h2 className="font-bold mb-2">Журнал</h2>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded h-60 overflow-auto font-mono text-xs whitespace-pre-line">
                    {log || 'Журнал пуст. Запустите тесты для получения информации.'}
                </div>
            </Card>
        </div>
    );
};

export default DebugPage;

