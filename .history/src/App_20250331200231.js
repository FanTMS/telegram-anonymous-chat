import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import RegistrationForm from './components/RegistrationForm';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [telegramUser, setTelegramUser] = useState(null);

    useEffect(() => {
        // Получаем данные пользователя Telegram
        const tgUser = WebApp.initDataUnsafe.user;
        console.log("Telegram user data:", tgUser);
        setTelegramUser(tgUser);

        const checkUser = async () => {
            try {
                // Получаем Telegram ID пользователя
                const telegramId = tgUser?.id;

                if (!telegramId) {
                    console.warn("Telegram ID не найден. Пользователь может использовать бота не из Telegram.");
                    setLoading(false);
                    return;
                }

                // Проверяем, есть ли пользователь в базе данных
                const userQuery = query(collection(db, "users"), where("telegramId", "==", telegramId));
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    // Пользователь уже зарегистрирован
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
    }, []);

    const handleRegistration = async (userData) => {
        try {
            const telegramId = telegramUser?.id;

            if (!telegramId) {
                throw new Error("Не удалось получить ID пользователя Telegram");
            }

            // Собираем дополнительную информацию о пользователе из Telegram
            const newUser = {
                ...userData,
                telegramId,
                telegramUsername: telegramUser?.username || null,
                telegramFirstName: telegramUser?.first_name || null,
                telegramLastName: telegramUser?.last_name || null,
                telegramLanguageCode: telegramUser?.language_code || null,
                registeredAt: new Date()
            };

            console.log("Сохраняем пользователя с данными:", newUser);

            // Сохраняем пользователя в базе данных
            const docRef = await addDoc(collection(db, "users"), newUser);
            console.log("Пользователь добавлен с ID:", docRef.id);

            setUser(newUser);

            // Показываем уведомление об успешной регистрации
            WebApp.showPopup({
                title: 'Успешная регистрация',
                message: 'Вы успешно зарегистрировались в анонимном чате!',
                buttons: [{ text: "OK" }]
            });

        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            WebApp.showPopup({
                title: 'Ошибка',
                message: 'Не удалось завершить регистрацию. Попробуйте позже.',
                buttons: [{ text: "OK" }]
            });
        }
    };

    if (loading) {
        return <div className="container">Загрузка...</div>;
    }

    return (
        <div className="container">
            {!user ? (
                <>
                    {telegramUser ? (
                        <RegistrationForm onSubmit={handleRegistration} telegramUser={telegramUser} />
                    ) : (
                        <div>
                            <h1>Ошибка</h1>
                            <p>Этот бот должен быть запущен из Telegram. Пожалуйста, откройте бота в Telegram.</p>
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
                </div>
            )}
        </div>
    );
}

export default App;
