import React, { createContext, useState, useEffect } from 'react';
import { getTelegramUser } from '../utils/telegramUtils';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Создаем контекст с дефолтными значениями
export const UserContext = createContext({
    user: null,
    setUser: () => { },
    isAuthenticated: false,
    loading: true,
    telegramData: null
});

// Провайдер контекста, который будет оборачивать приложение
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [telegramData, setTelegramData] = useState(null);

    // Проверка, запущено ли приложение в мобильном Telegram
    const isMobileTelegram = /Telegram/i.test(navigator.userAgent) || 
                           document.referrer.includes('t.me') || 
                           window.location.href.includes('tg://') ||
                           localStorage.getItem('is_telegram_webapp') === 'true' ||
                           sessionStorage.getItem('is_telegram_webapp') === 'true';

    // Вспомогательная функция для сохранения данных пользователя
    const saveUserToStorage = (userData) => {
        if (!userData) return;
        
        try {
            // Сохраняем в оба хранилища для лучшей надежности
            localStorage.setItem('current_user', JSON.stringify(userData));
            sessionStorage.setItem('current_user', JSON.stringify(userData));
            
            // Сохраняем ID отдельно для быстрого доступа
            if (userData.id) {
                localStorage.setItem('current_user_id', userData.id);
                sessionStorage.setItem('current_user_id', userData.id);
            }
            
            console.log('UserContext: Данные пользователя сохранены в хранилища', userData.id);
        } catch (e) {
            console.error('Ошибка при сохранении данных пользователя:', e);
        }
    };

    // Загрузка Telegram данных
    useEffect(() => {
        try {
            console.log('UserContext: Запущено в мобильном Telegram?', isMobileTelegram);
            
            // Получаем данные пользователя Telegram
            const tgUser = getTelegramUser();
            if (tgUser) {
                console.log('UserContext: Получены данные пользователя Telegram', tgUser);
                setTelegramData(tgUser);
                
                // Сохраняем Telegram данные в sessionStorage для доступа из других частей приложения
                sessionStorage.setItem('telegramUser', JSON.stringify(tgUser));

                // Если мы на мобильном устройстве и получили данные пользователя, автоматически создаем/обновляем пользователя
                if (isMobileTelegram || tgUser.is_mobile_telegram || tgUser.from_init_data || tgUser.from_url_params) {
                    const telegramId = tgUser.id ? tgUser.id.toString() : '';
                    const userId = `tg_${telegramId}`;
                    
                    // Сохраняем ID пользователя для автоматического входа
                    localStorage.setItem('current_user_id', userId);
                    sessionStorage.setItem('current_user_id', userId);
                    
                    // Создаем или обновляем пользователя с использованием Telegram данных
                    createOrUpdateUser(userId, tgUser);
                    
                    // Запись в sessionStorage отдельно для совместимости с существующим кодом
                    sessionStorage.setItem('userData', JSON.stringify({
                        id: userId,
                        telegramData: {
                            telegramId: tgUser.id,
                            username: tgUser.username,
                            firstName: tgUser.first_name,
                            lastName: tgUser.last_name,
                            languageCode: tgUser.language_code
                        }
                    }));
                }
            } else {
                console.log('UserContext: Данные пользователя Telegram не найдены');
                // Проверим в sessionStorage
                const cachedTelegramUser = sessionStorage.getItem('telegramUser');
                if (cachedTelegramUser) {
                    const parsedData = JSON.parse(cachedTelegramUser);
                    setTelegramData(parsedData);
                    
                    // Если мы на мобильном устройстве, используем кэшированные данные
                    if (isMobileTelegram) {
                        const telegramId = parsedData.id ? parsedData.id.toString() : '';
                        const userId = `tg_${telegramId}`;
                        localStorage.setItem('current_user_id', userId);
                        sessionStorage.setItem('current_user_id', userId);
                        
                        // Используем кэшированные данные для создания/обновления пользователя
                        createOrUpdateUser(userId, parsedData);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при получении данных Telegram:', error);
        }
    }, []);

    // Создание или обновление пользователя в Firebase
    const createOrUpdateUser = async (userId, telegramData) => {
        if (!userId || !telegramData) return;
        
        try {
            console.log('Обновление данных пользователя в Firebase:', userId);
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                // Создаем нового пользователя
                console.log('Создаем нового пользователя:', userId);
                await setDoc(userRef, {
                    id: userId,
                    name: telegramData.first_name || 'Пользователь Telegram',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    telegramData: {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || '',
                        languageCode: telegramData.language_code || 'ru'
                    }
                });
                
                // Создаем новый объект пользователя для контекста
                const newUser = {
                    id: userId,
                    name: telegramData.first_name || 'Пользователь Telegram',
                    telegramData: {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || '',
                        languageCode: telegramData.language_code || 'ru'
                    }
                };
                
                // Сохраняем в localStorage и sessionStorage для восстановления сессии
                saveUserToStorage(newUser);
                setUser(newUser);
            } else {
                // Обновляем существующего пользователя
                console.log('Обновляем существующего пользователя:', userId);
                const userData = userDoc.data();
                const updatedUser = {
                    ...userData,
                    updatedAt: serverTimestamp(),
                    telegramData: {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || '',
                        languageCode: telegramData.language_code || 'ru'
                    }
                };
                
                await setDoc(userRef, updatedUser, { merge: true });
                
                // Создаем объект пользователя для контекста
                const contextUser = {
                    ...userData,
                    id: userId,
                    telegramData: {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || '',
                        languageCode: telegramData.language_code || 'ru'
                    }
                };
                
                // Сохраняем в localStorage и sessionStorage для восстановления сессии
                saveUserToStorage(contextUser);
                setUser(contextUser);
            }
        } catch (error) {
            console.error('Ошибка при создании/обновлении пользователя:', error);
        }
    };

    // Проверка авторизации при загрузке
    useEffect(() => {
        // Пытаемся получить данные пользователя из localStorage и sessionStorage
        const loadUser = async () => {
            try {
                console.log('UserContext: Проверка авторизации в хранилищах');
                
                // Проверяем и current_user_id, и current_user в обоих хранилищах
                const savedUserId = localStorage.getItem('current_user_id') || sessionStorage.getItem('current_user_id');
                const savedUserData = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');

                // В Telegram Mini App могут быть проблемы с хранилищем
                if (!savedUserData && !savedUserId && isMobileTelegram) {
                    console.log('UserContext: В Telegram Mini App нет сохраненных данных, пробуем получить данные');
                    
                    // Получаем данные из Telegram параметров
                    const tgUser = getTelegramUser();
                    if (tgUser) {
                        const telegramId = tgUser.id ? tgUser.id.toString() : '';
                        const userId = `tg_${telegramId}`;
                        
                        // Создаем пользователя с данными Telegram
                        createOrUpdateUser(userId, tgUser);
                        setLoading(false);
                        return;
                    }
                    
                    // Ещё одна попытка - проверяем сохраненные данные Telegram
                    const telegramCached = localStorage.getItem('telegram_last_user') || 
                                         sessionStorage.getItem('telegram_last_user') || 
                                         sessionStorage.getItem('telegramUser');
                    
                    if (telegramCached) {
                        try {
                            const parsedTgData = JSON.parse(telegramCached);
                            const telegramId = parsedTgData.id ? parsedTgData.id.toString() : '';
                            const userId = `tg_${telegramId}`;
                            
                            // Создаем пользователя с кешированными данными Telegram
                            createOrUpdateUser(userId, parsedTgData);
                            setLoading(false);
                            return;
                        } catch (e) {
                            console.error('Ошибка при работе с кешированными данными Telegram:', e);
                        }
                    }
                }
                
                if (savedUserData) {
                    // Если есть полные данные пользователя
                    const userData = JSON.parse(savedUserData);
                    console.log('UserContext: Найдены данные пользователя в хранилище', userData);
                    
                    // Обновляем данные Telegram, если они доступны
                    if (telegramData && (!userData.telegramData || !userData.telegramData.telegramId)) {
                        userData.telegramData = {
                            telegramId: telegramData.id?.toString(),
                            username: telegramData.username,
                            firstName: telegramData.first_name,
                            lastName: telegramData.last_name,
                            languageCode: telegramData.language_code
                        };
                        // Сохраняем обновленные данные
                        saveUserToStorage(userData);
                        
                        // Обновляем пользователя в Firebase
                        if (userData.id) {
                            createOrUpdateUser(userData.id, telegramData);
                        }
                    }
                    
                    setUser(userData);
                } else if (savedUserId) {
                    // Если находим только ID, пытаемся получить полные данные из sessionStorage
                    console.log('UserContext: Найден ID пользователя:', savedUserId);
                    const sessionData = sessionStorage.getItem('userData');

                    if (sessionData) {
                        const parsedData = JSON.parse(sessionData);
                        // Обновляем данные Telegram, если они доступны
                        if (telegramData) {
                            parsedData.telegramData = {
                                telegramId: telegramData.id?.toString(),
                                username: telegramData.username,
                                firstName: telegramData.first_name,
                                lastName: telegramData.last_name,
                                languageCode: telegramData.language_code
                            };
                            
                            // Обновляем пользователя в Firebase
                            createOrUpdateUser(savedUserId, telegramData);
                        }
                        setUser(parsedData);
                    } else {
                        // Пытаемся получить пользователя из Firebase
                        try {
                            const userRef = doc(db, "users", savedUserId);
                            const userDoc = await getDoc(userRef);
                            
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                console.log('UserContext: Получены данные пользователя из Firebase', userData);
                                
                                // Создаем объект пользователя для контекста
                                const contextUser = {
                                    ...userData,
                                    id: savedUserId
                                };
                                
                                // Обновляем с данными Telegram, если доступны
                                if (telegramData) {
                                    contextUser.telegramData = {
                                        telegramId: telegramData.id?.toString(),
                                        username: telegramData.username,
                                        firstName: telegramData.first_name,
                                        lastName: telegramData.last_name,
                                        languageCode: telegramData.language_code
                                    };
                                }
                                
                                // Сохраняем данные
                                saveUserToStorage(contextUser);
                                setUser(contextUser);
                            } else {
                                // В противном случае ставим минимальную информацию с данными Telegram, если доступны
                                const baseUser = { id: savedUserId };
                                if (telegramData) {
                                    baseUser.telegramData = {
                                        telegramId: telegramData.id?.toString(),
                                        username: telegramData.username,
                                        firstName: telegramData.first_name,
                                        lastName: telegramData.last_name,
                                        languageCode: telegramData.language_code
                                    };
                                    baseUser.name = telegramData.first_name || "Пользователь";
                                    
                                    // Обновляем пользователя в Firebase
                                    createOrUpdateUser(savedUserId, telegramData);
                                }
                                setUser(baseUser);
                            }
                        } catch (e) {
                            console.error('Ошибка при получении данных пользователя из Firebase:', e);
                            
                            // В случае ошибки - минимальная информация
                            const baseUser = { id: savedUserId };
                            if (telegramData) {
                                baseUser.telegramData = {
                                    telegramId: telegramData.id?.toString(),
                                    username: telegramData.username,
                                    firstName: telegramData.first_name,
                                    lastName: telegramData.last_name,
                                    languageCode: telegramData.language_code
                                };
                                baseUser.name = telegramData.first_name || "Пользователь";
                            }
                            setUser(baseUser);
                        }
                    }
                } else if (telegramData) {
                    console.log('UserContext: Пользователь не найден в хранилищах, но есть данные Telegram');
                    // Если есть данные Telegram, создаем временного пользователя
                    const telegramId = telegramData.id?.toString();
                    const userId = `tg_${telegramId}`;
                    
                    // Сохраняем ID для автоматического входа в следующий раз
                    localStorage.setItem('current_user_id', userId);
                    sessionStorage.setItem('current_user_id', userId);
                    
                    const tempUser = {
                        id: userId,
                        name: telegramData.first_name || "Пользователь Telegram",
                        telegramData: {
                            telegramId: telegramData.id?.toString(),
                            username: telegramData.username,
                            firstName: telegramData.first_name,
                            lastName: telegramData.last_name,
                            languageCode: telegramData.language_code
                        }
                    };
                    
                    // Сохраняем пользователя в хранилище
                    saveUserToStorage(tempUser);
                    setUser(tempUser);
                    
                    // Создаем пользователя в Firebase
                    createOrUpdateUser(userId, telegramData);
                } else {
                    console.log('UserContext: Пользователь не найден и нет данных Telegram');
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadUser();
    }, [telegramData]);

    // Определяем, авторизован ли пользователь
    const isAuthenticated = !!user;

    // Значение контекста
    const contextValue = {
        user,
        setUser,
        isAuthenticated,
        loading,
        telegramData
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};
