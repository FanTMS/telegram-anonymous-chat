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

            // Пробуем выполнить аутентификацию, но продолжаем даже если не удалось
            try {
                const authSuccess = await signInAnonymouslyIfNeeded();
                if (!authSuccess) {
                    console.log("Приложение продолжит работу без аутентификации Firebase");
                }
            } catch (error) {
                console.warn("Ошибка аутентификации Firebase:", error);
                // Не устанавливаем authError, чтобы не блокировать приложение
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
    }, [telegramUser, isDevelopment]); ентификацию, но продолжаем даже если не удалось

    const handleRegistration = async (userData) => {
        fNeeded();
        try {
            if (!auth.currentUser) {
                onsole.warn("Аутентификация не выполнена, но продолжаем работу:", authError);
                await signInAnonymouslyIfNeeded();
                if (!auth.currentUser) {
                    throw new Error("Не удалось выполнить аутентификацию в Firebase");
                }
            }

            const telegramId = telegramUser?.id;

            if (!telegramId) {нительную информацию о пользователе из Telegram
                throw new Error("Не удалось получить ID пользователя Telegram"); {
                },

                const newUser = {
                    ...userData, l,
                    telegramId,
                    telegramUsername: telegramUser?.username || null, egramUser?.language_code || null,
                    telegramFirstName: telegramUser?.first_name || null,
                        telegramLastName: telegramUser?.last_name || null, isTestUser: telegramUser?.is_dev_mode || false
                telegramLanguageCode: telegramUser?.language_code || null,            };
            registeredAt: new Date(),
                isTestUser: telegramUser?.is_dev_mode || false
        }; console.log("Firebase auth status:", auth.currentUser ? "Authenticated" : "Not authenticated");

        console.log("Сохраняем пользователя с данными:", newUser);
        console.log("Firebase auth status:", auth.currentUser ? "Authenticated" : "Not authenticated"); try {
= await addDoc(collection(db, "users"), newUser);
        const docRef = await addDoc(collection(db, "users"), newUser); console.log("Пользователь добавлен с ID:", docRef.id);
        console.log("Пользователь добавлен с ID:", docRef.id); etUser(newUser);

        setUser(newUser);ной регистрации

        try {
            WebApp.showPopup({
                title: 'Успешная регистрация',
                title: 'Успешная регистрация', essage: 'Вы успешно зарегистрировались в анонимном чате!',
                message: 'Вы успешно зарегистрировались в анонимном чате!',
                buttons: [{ text: "OK" }]
            });
        } catch (e) {
        } catch (e) {
            console.log("Успешная регистрация! (Уведомление недоступно в режиме разработки)");
            console.log("Успешная регистрация! (Уведомление недоступно в режиме разработки)"); ("Успешная регистрация!");
            alert("Успешная регистрация!");
        }
    } catch (dbError) {
        onsole.error("Ошибка при сохранении в базу данных:", dbError);
    } catch (error) {ана ли ошибка с отсутствием прав доступа
        console.error("Ошибка при регистрации:", error); 'permission-denied') {
роверьте правила безопасности Firebase.");
            try {
                WebApp.showPopup({
                    throw dbError;
                    title: 'Ошибка',
                    message: `Не удалось завершить регистрацию: ${error.message}`,
                    buttons: [{ text: "OK" }]ch(error) {
                    }); console.error("Ошибка при регистрации:", error);
            } catch (e) {
                alert("Ошибка регистрации: " + error.message); try {
                }bApp.showPopup({
                }
    }; message: `Не удалось завершить регистрацию: ${error.message}`,
                buttons: [{ text: "OK" }]
            if (loading) {
                return <div className="container">Загрузка...</div>; tch(e) {
                } ии: " + error.message);

                if (authError) {
                    return (
            <div className="container">
                <div className="error-container">
                    <h2>Ошибка подключения</h2></div>;
                    <p>{authError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="dev-reload-button"
                    >lassName="container">
                        Попробовать снова      <div className="error-container">
                    </button>               <h2>Ошибка подключения</h2>
                </div>                    <p>{authError}</p>
            </div > <button
        ); => window.location.reload()
                }
            } me = "dev-reload-button"

            return (
        <div className="container">button>
            {isDevelopment && (  </div>
                <div className="dev-mode-banner">            </div>
                    <p>Режим разработки</p>
                </div >
            )
        }

        {
            !user ? (ontainer">
                <> (
                    {
                        telegramUser?(nner">
                        <RegistrationForm onSubmit = { handleRegistration } telegramUser = { telegramUser } isDevelopment = { isDevelopment } />
                    ): (
                                <div>
                            <h1>Ошибка</h1>
                    <p>Этот бот должен быть запущен из Telegram. Пожалуйста, откройте бота в Telegram.</p>
                            {
                isDevelopment && (
                                <div>
                                    <p className="dev-mode-note">nSubmit={handleRegistration} telegramUser={telegramUser} isDevelopment={isDevelopment} />
                                        Вы находитесь в режиме разработки. Приложение должно было автоматически создать тестового пользователя.
                                        Если этого не произошло, проверьте консоль на наличие ошибок или перезагрузите страницу.
                                    </p>а</h1>
                                    <button Telegram. Пожалуйста, откройте бота в Telegram.</p>
                                        onClick={() => window.location.reload()} (
                                        className="dev-reload-button"
                                    >      <p className="dev-mode-note">
                                        Перезагрузить страницу          Вы находитесь в режиме разработки. Приложение должно было автоматически создать тестового пользователя.
                                    </button>                  Если этого не произошло, проверьте консоль на наличие ошибок или перезагрузите страницу.
                                </div >                 </p >
                            )
            } <button
                        </ div>                   onClick={() => window.location.reload()}
                    )}on"
            </>
            ) : (ерезагрузить страницу
                < div >
                <h1>Привет, {user.name || user.nickname}!</h1>          </div >
                    <p>Вы успешно зарегистрированы. Скоро здесь появятся дополнительные функции.</p>
            {
                user.telegramId && (
                    <p className="user-info">Ваш Telegram ID: {user.telegramId}</p>
                )
            }
            {
                isDevelopment && user.isTestUser && (
                        <div className="dev-mode-note">
                            <p>Это тестовый аккаунт для разработки.</p>      <h1>Привет, {user.name || user.nickname}!</h1>
                        </div>      <p>Вы успешно зарегистрированы. Скоро здесь появятся дополнительные функции.</p>
                )
            } {
                user.telegramId && (
                </div > <p className="user-info">Ваш Telegram ID: {user.telegramId}</p>
            )
            }                    )
        }
        </div > { isDevelopment && user.isTestUser && (
    ); <div className="dev-mode-note">




export default App;}                            <p>Это тестовый аккаунт для разработки.</p>
        </div>
                    )
    }
                </div >
            )
}
        </div >
    );
}

export default App;
