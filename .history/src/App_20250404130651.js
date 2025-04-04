import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import WebApp from '@twa-dev/sdk';
import { testFirebaseConnection } from './utils/firebaseTest';

// Импорт компонентов
import RegistrationForm from './components/RegistrationForm';
import ChatsList from './pages/ChatsList';
import Chat from './pages/Chat';
import RandomChat from './pages/RandomChat';
import NotFound from './components/NotFound';
import MainMenu from './components/MainMenu';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';

// Импорт страницы руководства вынесен в отдельный блок для решения проблемы
import BeginnerGuide from './components/BeginnerGuide';

import './App.css';

// Проверка режима разработки
const isDevelopment = process.env.NODE_ENV === 'development';

// Основной компонент приложения
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [telegramUser, setTelegramUser] = useState(null);

    // Функция для анонимной авторизации при необходимости
    const signInAnonymouslyIfNeeded = async () => {
        try {
            // Если уже есть пользователь, не делаем ничего
            if (auth.currentUser) {
                return auth.currentUser;
            }

            // Анонимный вход
            const userCredential = await signInAnonymously(auth);
            return userCredential.user;
        } catch (error) {
            console.error("Error during anonymous sign-in:", error);
            throw error;
        }
    };

    // Проверка авторизации при загрузке приложения
    useEffect(() => {
        // Очищаем флаг незавершенной регистрации при запуске
        const registrationInProgress = localStorage.getItem('registration_in_progress');
        if (registrationInProgress) {
            console.log("Обнаружена незавершенная регистрация, очищаем состояние");
            localStorage.removeItem('registration_in_progress');
        }

        const checkAuth = async () => {
            try {
                console.log("Запуск проверки авторизации...");

                // Проверяем соединение с Firebase
                try {
                    const isConnected = await testFirebaseConnection();
                    if (!isConnected) {
                        console.error("Не удалось подключиться к Firebase");
                        setLoading(false);
                        return;
                    }
                    console.log("Соединение с Firebase установлено успешно");
                } catch (connectionError) {
                    console.error("Ошибка при проверке соединения с Firebase:", connectionError);
                    setLoading(false);
                    return;
                }

                // Сначала проверяем сохраненный ID пользователя
                const savedUserId = localStorage.getItem('current_user_id');
                if (savedUserId) {
                    console.log("Найден ID пользователя в localStorage:", savedUserId);
                    try {
                        const userDoc = await getDoc(doc(db, "users", savedUserId));
                        if (userDoc.exists()) {
                            const userData = { id: savedUserId, ...userDoc.data() };
                            console.log("Пользователь загружен из базы:", userData);
                            setUser(userData);
                            setLoading(false);
                            return;
                        } else {
                            console.log("Пользователь не найден в базе данных, удаляем ID из localStorage");
                            localStorage.removeItem('current_user_id');
                        }
                    } catch (error) {
                        console.error("Ошибка при получении пользователя из localStorage:", error);
                        localStorage.removeItem('current_user_id');
                    }
                }

                // Проверка авторизации через Telegram
                const telegramUser = WebApp.initDataUnsafe?.user;
                let telegramId = telegramUser?.id?.toString();

                // Сохраняем Telegram пользователя для отображения в форме
                if (telegramUser) {
                    console.log("Получены данные Telegram пользователя:", telegramUser);
                    setTelegramUser(telegramUser);
                }

                // В режиме разработки можем использовать тестовый ID
                if (isDevelopment && !telegramId) {
                    telegramId = "test_user_" + Math.floor(Math.random() * 10000);
                    console.warn("Режим разработки: используется тестовый Telegram ID:", telegramId);
                }

                if (!telegramId) {
                    console.log("Telegram ID не получен, требуется регистрация");
                    setLoading(false);
                    return;
                }

                // Проверяем, есть ли пользователь с таким Telegram ID в базе
                console.log("Проверка существования пользователя в базе по Telegram ID:", telegramId);
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("telegramId", "==", telegramId));

                try {
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        // Пользователь найден
                        const userData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                        console.log("Пользователь найден в базе данных:", userData);

                        // Сохраняем ID пользователя в localStorage
                        localStorage.setItem('current_user_id', userData.id);
                        setUser(userData);
                    } else {
                        console.log("Пользователь не найден в базе данных, требуется регистрация");
                    }
                } catch (queryError) {
                    console.error("Ошибка при запросе пользователя:", queryError);
                }
            } catch (error) {
                console.error("Ошибка при проверке авторизации:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [isDevelopment]);

    // Функция для обработки создания пользователя
    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    // Обработка отправки формы регистрации
    const handleRegistration = async (userData) => {
        try {
            console.log("Начало процесса регистрации пользователя...");

            // Анонимная авторизация (если не авторизован)
            await signInAnonymouslyIfNeeded();

            const telegramUser = WebApp.initDataUnsafe?.user;
            let telegramId = telegramUser?.id?.toString();

            // В режиме разработки используем тестовый ID
            if (isDevelopment && !telegramId) {
                telegramId = "test_user_" + Math.floor(Math.random() * 10000);
                console.warn("Режим разработки: используется тестовый Telegram ID:", telegramId);
            }

            if (!telegramId) {
                throw new Error("Не удалось получить Telegram ID");
            }

            // Проверяем существование пользователя
            console.log("Проверка существования пользователя с Telegram ID:", telegramId);
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("telegramId", "==", telegramId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Пользователь уже существует
                const existingUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                console.log("Пользователь уже существует:", existingUser);
                setUser(existingUser);

                // Сохраняем ID пользователя в localStorage
                localStorage.setItem('current_user_id', existingUser.id);
                localStorage.removeItem('registration_in_progress');

                // Успешная вибрация
                if (WebApp.HapticFeedback) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                }

                try {
                    WebApp.showPopup({
                        title: 'Информация',
                        message: 'Вы уже зарегистрированы в системе',
                        buttons: [{ text: "OK" }]
                    });
                } catch (e) {
                    console.log("Не удалось показать popup:", e);
                }

                // Принудительное перенаправление на главную страницу
                setTimeout(() => {
                    window.location.href = '/chats';
                }, 500);

                return;
            }

            // Создаем нового пользователя
            try {
                console.log("Создание нового пользователя с данными:", { ...userData, telegramId });

                const userDataWithTelegramId = {
                    ...userData,
                    telegramId,
                    createdAt: new Date(),
                    lastActive: new Date()
                };

                const docRef = await addDoc(usersRef, userDataWithTelegramId);
                console.log("Новый пользователь добавлен с ID:", docRef.id);

                const newUser = { id: docRef.id, ...userDataWithTelegramId };
                console.log("Новый пользователь создан:", newUser);
                setUser(newUser);

                // Сохраняем ID пользователя в localStorage
                localStorage.setItem('current_user_id', docRef.id);
                localStorage.removeItem('registration_in_progress');

                // Успешная вибрация
                if (WebApp.HapticFeedback) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                }

                try {
                    WebApp.showPopup({
                        title: 'Успешная регистрация',
                        message: 'Теперь вы можете общаться с другими пользователями',
                        buttons: [{ text: "Начать" }]
                    });
                } catch (e) {
                    console.log("Не удалось показать popup:", e);
                }

                // Принудительное перенаправление
                setTimeout(() => {
                    window.location.href = '/chats';
                }, 500);

            } catch (dbError) {
                console.error("Ошибка при сохранении в базу данных:", dbError);
                if (dbError.code === 'permission-denied') {
                    throw new Error("Недостаточно прав для записи в базу данных. Проверьте правила безопасности Firebase.");
                } else {
                    throw dbError;
                }
            }
        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            localStorage.removeItem('registration_in_progress');

            try {
                WebApp.showPopup({
                    title: 'Ошибка',
                    message: `Не удалось завершить регистрацию: ${error.message}`,
                    buttons: [{ text: "OK" }]
                });
            } catch (e) {
                alert("Ошибка регистрации: " + error.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <Router>
            <div className="App">
                <Routes>
                    {!user && (
                        <Route
                            path="*"
                            element={<RegistrationForm onSubmit={handleRegistration} isDevelopment={isDevelopment} />}
                        />
                    )}

                    {user && (
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<Navigate to="/chats" replace />} />
                            <Route path="/index.html" element={<Navigate to="/chats" replace />} />
                            <Route path="/chats" element={<ChatsList user={user} />} />
                            <Route path="/chat/:chatId" element={<Chat user={user} />} />
                            <Route path="/random-chat" element={<RandomChat user={user} />} />
                            <Route path="/profile" element={<Profile user={user} onUpdate={handleProfileUpdate} />} />
                            <Route path="/guide" element={<BeginnerGuide />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    )}
                </Routes>

                {user && <MainMenu />}
            </div>
        </Router>
    );
}

export default App;
