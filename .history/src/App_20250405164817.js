import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

// Импорт компонентов
import RegistrationForm from './components/RegistrationForm';
import Home from './pages/Home';
import ChatsList from './pages/ChatsList';
import Chat from './pages/Chat';
import RandomChat from './pages/RandomChat';
import NotFoundPage from './pages/NotFoundPage';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';
import BeginnerGuide from './pages/BeginnerGuide';
import AdminSupport from './pages/AdminSupport';
import MainMenu from './components/MainMenu';
import SupportDiagnostics from './pages/SupportDiagnostics';
import PageTransition from './components/PageTransition';

import './styles/BeginnerGuide.css'; // Добавляем импорт для гарантии загрузки стилей
import './App.css';

import { testFirebaseConnection, diagnoseFirebaseIssues } from './utils/firebaseDebugUtils';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const telegramUser = null; // Replace with actual telegram user state
    const isDevelopment = false; // Replace with actual environment state

    const handleRegistrationSubmit = async (formData) => {
        try {
            console.log("Начало обработки регистрации пользователя:", formData);

            // Проверка соединения с Firebase перед регистрацией
            const isConnected = await testFirebaseConnection();
            if (!isConnected) {
                console.error("Не удалось подключиться к Firebase");
                throw new Error("Не удалось подключиться к базе данных. Пожалуйста, проверьте подключение к интернету.");
            }

            // Получаем данные о пользователе из Telegram WebApp
            let userDataWithTelegramId = { ...formData };

            if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                const telegramUser = WebApp.initDataUnsafe.user;
                userDataWithTelegramId.telegramId = telegramUser.id?.toString();
                userDataWithTelegramId.firstName = telegramUser.first_name;
                userDataWithTelegramId.lastName = telegramUser.last_name;
                userDataWithTelegramId.username = telegramUser.username;
                userDataWithTelegramId.languageCode = telegramUser.language_code;
                console.log("Добавлены данные Telegram пользователя:", userDataWithTelegramId);
            } else {
                console.warn("Не удалось получить данные из Telegram WebApp");
                // В режиме разработки добавляем тестовые данные
                if (process.env.NODE_ENV === 'development') {
                    userDataWithTelegramId.telegramId = `dev_${Date.now()}`;
                } else {
                    throw new Error("Не удалось получить идентификатор пользователя Telegram");
                }
            }

            // Добавляем дополнительные поля
            userDataWithTelegramId = {
                ...userDataWithTelegramId,
                chats: [],
                activeChatId: null,
                totalMessages: 0,
                registrationDate: new Date(),
                lastActive: new Date()
            };

            // Запускаем диагностику перед сохранением
            const diagnosticResults = await diagnoseFirebaseIssues(userDataWithTelegramId);
            if (!diagnosticResults.writeTest || !diagnosticResults.readTest) {
                console.error("Диагностика выявила проблемы:", diagnosticResults);
                throw new Error("Проблема с доступом к базе данных. Пожалуйста, попробуйте позже.");
            }

            // Создаем пользователя в Firestore
            const usersRef = collection(db, "users");
            const docRef = await addDoc(usersRef, userDataWithTelegramId);
            console.log("Новый пользователь добавлен с ID:", docRef.id);

            const newUser = { id: docRef.id, ...userDataWithTelegramId };
            console.log("Новый пользователь создан:", newUser);

            // Сохраняем ID пользователя в localStorage
            localStorage.setItem('current_user_id', docRef.id);
            localStorage.removeItem('registration_in_progress');

            // Включаем пользователя и останавливаем загрузку
            setUser(newUser);
            setLoading(false);

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
                console.warn("Не удалось показать popup:", e);
            }

        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            localStorage.removeItem('registration_in_progress');

            try {
                if (WebApp && WebApp.showPopup) {
                    WebApp.showPopup({
                        title: 'Ошибка регистрации',
                        message: error.message || "Не удалось завершить регистрацию",
                        buttons: [{ text: "OK" }]
                    });
                } else {
                    alert("Ошибка регистрации: " + (error.message || "Неизвестная ошибка"));
                }
            } catch (e) {
                console.error("Не удалось показать сообщение об ошибке:", e);
                alert("Ошибка регистрации: " + (error.message || "Неизвестная ошибка"));
            }

            throw error; // пробрасываем ошибку дальше для обработки в компоненте формы
        }
    };

    const handleProfileUpdate = () => {
        // Replace with actual profile update handler
    };

    return (
        <ToastProvider>
            <UserProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {!user && (
                                <Route
                                    path="*"
                                    element={<RegistrationForm onSubmit={handleRegistrationSubmit} telegramUser={telegramUser} isDevelopment={isDevelopment} />}
                                />
                            )}

                            {user && (
                                <Route element={<AppLayout />}>
                                    <Route path="/" element={<Navigate to="/home" replace />} />
                                    <Route path="/index.html" element={<Navigate to="/home" replace />} />
                                    <Route path="/home" element={
                                        <PageTransition>
                                            <Home user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/chats" element={
                                        <PageTransition>
                                            <ChatsList user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/chat/:chatId" element={
                                        <PageTransition>
                                            <Chat user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/random-chat" element={
                                        <PageTransition>
                                            <RandomChat user={user} />
                                        </PageTransition>
                                    } />
                                    <Route path="/profile" element={
                                        <PageTransition>
                                            <Profile user={user} onUpdate={handleProfileUpdate} />
                                        </PageTransition>
                                    } />
                                    <Route path="/guide" element={
                                        <PageTransition>
                                            <BeginnerGuide />
                                        </PageTransition>
                                    } />
                                    <Route path="/admin/support" element={<AdminSupport />} />
                                    <Route path="*" element={<NotFoundPage />} />
                                </Route>
                            )}
                            <Route path="/diagnostics" element={<SupportDiagnostics />} />
                        </Routes>
                        <MainMenu />
                    </div>
                </Router>
            </UserProvider>
        </ToastProvider>
    );
}

export default App;
