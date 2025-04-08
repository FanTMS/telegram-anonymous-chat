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
                           sessionStorage.getItem('is_telegram_webapp') === 'true';

    // Вспомогательная функция для сохранения данных пользователя
    const saveUserToStorage = (userData) => {
        if (!userData) return;
        
        try {
            // Сохраняем только в sessionStorage для предотвращения проблем с localStorage
            sessionStorage.setItem('current_user', JSON.stringify(userData));
            
            // Сохраняем ID отдельно для быстрого доступа
            if (userData.id) {
                sessionStorage.setItem('current_user_id', userData.id);
            }
            
            console.log('UserContext: Данные пользователя сохранены в sessionStorage', userData.id);
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
                
                // Сохраняем в sessionStorage для восстановления сессии
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
                
                // Сохраняем в sessionStorage для восстановления сессии
                saveUserToStorage(contextUser);
                setUser(contextUser);
            }
        } catch (error) {
            console.error('Ошибка при создании/обновлении пользователя:', error);
        }
    };

    // Проверка авторизации при загрузке
    useEffect(() => {
        // Пытаемся получить данные пользователя из sessionStorage
        const loadUser = async () => {
            try {
                console.log('UserContext: Проверка авторизации в sessionStorage');
                
                // Проверяем и current_user_id, и current_user
                const savedUserId = sessionStorage.getItem('current_user_id');
                const savedUserData = sessionStorage.getItem('current_user');

                console.log('UserContext: savedUserId =', savedUserId, ', savedUserData =', savedUserData ? 'найдено' : 'не найдено');

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
                    const telegramCached = sessionStorage.getItem('telegram_last_user') || 
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
                    console.log('UserContext: Найдены данные пользователя в sessionStorage', userData);
                    
                    // Обновляем данные Telegram, если они доступны
                    if (telegramData && (!userData.telegramData || !userData.telegramData.telegramId)) {
                        userData.telegramData = {
                            telegramId: telegramData.id?.toString(),
                            username: telegramData.username || '',
                            firstName: telegramData.first_name || '',
                            lastName: telegramData.last_name || '',
                            languageCode: telegramData.language_code || 'ru'
                        };
                    }
                    
                    // Устанавливаем пользователя
                    setUser(userData);
                    
                    // Обновляем данные о последней активности
                    try {
                        if (userData.id) {
                            const userRef = doc(db, "users", userData.id);
                            await setDoc(userRef, {
                                lastActive: serverTimestamp()
                            }, { merge: true });
                        }
                    } catch (e) {
                        console.error('Ошибка при обновлении последней активности:', e);
                    }
                } else if (savedUserId) {
                    // Если есть только ID пользователя, загружаем данные из Firestore
                    try {
                        console.log('UserContext: Найден только ID пользователя. Загружаем из Firestore:', savedUserId);
                        const userRef = doc(db, "users", savedUserId);
                        const userDoc = await getDoc(userRef);
                        
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            console.log('UserContext: Данные пользователя получены из Firestore:', userData);
                            
                            // Проверяем, не удален ли пользователь
                            if (userData.deleted || userData.status === 'deleted' || userData.status === 'banned') {
                                console.log('UserContext: Пользователь удален или заблокирован');
                                // Очищаем данные пользователя из хранилища
                                sessionStorage.removeItem('current_user_id');
                                sessionStorage.removeItem('current_user');
                                // Не устанавливаем пользователя в состояние
                                setUser(null);
                            } else {
                                // Убедимся, что у нас есть ID для сохранения в кэш и для проверки
                                if (!userData.id) {
                                    userData.id = savedUserId;
                                }
                                
                                if (userData.id) {
                                    // Сохраняем полученные данные в кэш
                                    saveUserToStorage(userData);
                                    
                                    // Устанавливаем пользователя
                                    setUser(userData);
                                    
                                    // Обновляем данные о последней активности
                                    await setDoc(userRef, {
                                        lastActive: serverTimestamp()
                                    }, { merge: true });
                                }
                            }
                        } else {
                            console.log('UserContext: Пользователь не найден в Firestore');
                            // Очищаем устаревшие данные
                            sessionStorage.removeItem('current_user_id');
                            sessionStorage.removeItem('current_user');
                        }
                    } catch (e) {
                        console.error('Ошибка при загрузке данных пользователя из Firestore:', e);
                    }
                } else {
                    console.log('UserContext: Данные пользователя не найдены');
                }
            } catch (error) {
                console.error('Ошибка при загрузке пользователя:', error);
            } finally {
                console.log('UserContext: Завершение проверки авторизации, isAuthenticated =', !!user);
                setLoading(false);
            }
        };

        loadUser();
    }, [telegramData]);

    // Экспортируем значение контекста
    const value = {
        user,
        setUser,
        isAuthenticated: !!user,
        loading,
        telegramData
    };

    console.log('UserContext: Предоставление контекста с isAuthenticated =', !!user, ', user =', user ? user.id : 'null');

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
