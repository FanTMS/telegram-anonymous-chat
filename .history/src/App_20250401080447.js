import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { db, auth, signInAnonymouslyIfNeeded } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import RegistrationForm from './components/RegistrationForm';
import { testFirebaseConnection, testTelegramIdStorage } from './utils/firebaseTest';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [telegramUser, setTelegramUser] = useState(null);
    const [isDevelopment, setIsDevelopment] = useState(process.env.NODE_ENV === 'development');
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const initializeApp = async () => {
            const isDevMode = process.env.NODE_ENV === 'development';
            setIsDevelopment(isDevMode);

            try {
                await signInAnonymouslyIfNeeded();
            } catch (error) {
                console.error("Ошибка аутентификации Firebase:", error);
                setAuthError("Ошибка подключения к Firebase: " + error.message);
            }

            let tgUser;

            try {
                tgUser = WebApp.initDataUnsafe.user;
                console.log("Telegram user data:", tgUser);
            } catch (error) {
                console.warn("Ошибка получения данных пользователя Telegram:", error);
            }

            if (isDevMode && !tgUser) {
                tgUser = {
                    id: 123456789,
                    first_name: "Тестовый",
                    last_name: "Пользователь",
                    username: "test_user",
                    language_code: "ru",
                    is_dev_mode: true
                };
                console.log("Создан тестовый пользователь для разработки:", tgUser);
            }

            setTelegramUser(tgUser);

            const checkUser = async () => {
                try {
                    const telegramId = tgUser?.id;

                    if (!telegramId) {
                        console.warn("Telegram ID не найден. Пользователь может использовать бота не из Telegram.");
                        setLoading(false);
                        return;
                    }

                    const userQuery = query(collection(db, "users"), where("telegramId", "==", telegramId));
                    const userSnapshot = await getDocs(userQuery);

                    if (!userSnapshot.empty) {
                        const userData = userSnapshot.docs[0].data();
                        console.log("Найден пользователь:", userData);
                        setUser(userData);
                    } else {
                        console.log("Пользователь не найден в базе данных. Требуется регистрация.");
                    }

                    setLoading(false);
                } catch (error) {
                    console.error("Ошибка при проверке пользователя:", error);
                    setLoading(false);
                }
            };

            checkUser();
        };

        initializeApp();
    }, []);

    useEffect(() => {
        const runTests = async () => {
            const connectionResult = await testFirebaseConnection();
            console.log("Firebase connection test:", connectionResult ? "PASSED" : "FAILED");

            if (telegramUser?.id) {
                const storageResult = await testTelegramIdStorage(telegramUser.id);
                console.log("Telegram ID storage test:", storageResult ? "PASSED" : "FAILED");
            }
        };

        if (isDevelopment && telegramUser) {
            runTests();
        }
    }, [telegramUser, isDevelopment]);

    const handleRegistration = async (userData) => {
        try {
            if (!auth.currentUser) {
                await signInAnonymouslyIfNeeded();
                if (!auth.currentUser) {
                    throw new Error("Не удалось выполнить аутентификацию в Firebase");
                }
            }

            const telegramId = telegramUser?.id;

            if (!telegramId) {
                throw new Error("Не удалось получить ID пользователя Telegram");
            }

            const newUser = {
                ...userData,
                telegramId,
                telegramUsername: telegramUser?.username || null,
                telegramFirstName: telegramUser?.first_name || null,
                telegramLastName: telegramUser?.last_name || null,
                telegramLanguageCode: telegramUser?.language_code || null,
                registeredAt: new Date(),
                isTestUser: telegramUser?.is_dev_mode || false
            };

            console.log("Сохраняем пользователя с данными:", newUser);
            console.log("Firebase auth status:", auth.currentUser ? "Authenticated" : "Not authenticated");

            const docRef = await addDoc(collection(db, "users"), newUser);
            console.log("Пользователь добавлен с ID:", docRef.id);

            setUser(newUser);

            try {
                WebApp.showPopup({
                    title: 'Успешная регистрация',
                    message: 'Вы успешно зарегистрировались в анонимном чате!',
                    buttons: [{ text: "OK" }]
                });
            } catch (e) {
                console.log("Успешная регистрация! (Уведомление недоступно в режиме разработки)");
                alert("Успешная регистрация!");
            }

        } catch (error) {
            console.error("Ошибка при регистрации:", error);

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
        return <div className="container">Загрузка...</div>;
    }

    if (authError) {
        return (
            <div className="container">
                <div className="error-container">
                    <h2>Ошибка подключения</h2>
                    <p>{authError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="dev-reload-button"
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            {isDevelopment && (
                <div className="dev-mode-banner">
                    <p>Режим разработки</p>
                </div>
            )}

            {!user ? (
                <>
                    {telegramUser ? (
                        <RegistrationForm onSubmit={handleRegistration} telegramUser={telegramUser} isDevelopment={isDevelopment} />
                    ) : (
                        <div>
                            <h1>Ошибка</h1>
                            <p>Этот бот должен быть запущен из Telegram. Пожалуйста, откройте бота в Telegram.</p>
                            {isDevelopment && (
                                <div>
                                    <p className="dev-mode-note">
                                        Вы находитесь в режиме разработки. Приложение должно было автоматически создать тестового пользователя.
                                        Если этого не произошло, проверьте консоль на наличие ошибок или перезагрузите страницу.
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="dev-reload-button"
                                    >
                                        Перезагрузить страницу
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div>
                    <h1>Привет, {user.name || user.nickname}!</h1>
                    <p>Вы успешно зарегистрированы. Скоро здесь появятся дополнительные функции.</p>
                    {user.telegramId && (
                        <p className="user-info">Ваш Telegram ID: {user.telegramId}</p>
                    )}
                    {isDevelopment && user.isTestUser && (
                        <div className="dev-mode-note">
                            <p>Это тестовый аккаунт для разработки.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
