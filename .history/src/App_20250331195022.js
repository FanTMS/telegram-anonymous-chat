import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import RegistrationForm from './components/RegistrationForm';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Получаем Telegram ID пользователя
        const telegramId = WebApp.initDataUnsafe.user?.id;
        
        if (!telegramId) {
          setLoading(false);
          return;
        }
        
        // Проверяем, есть ли пользователь в базе данных
        const userQuery = query(collection(db, "users"), where("telegramId", "==", telegramId));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          // Пользователь уже зарегистрирован
          setUser(userSnapshot.docs[0].data());
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
      const telegramId = WebApp.initDataUnsafe.user?.id;
      
      if (!telegramId) {
        throw new Error("Не удалось получить ID пользователя Telegram");
      }
      
      const newUser = {
        ...userData,
        telegramId,
        registeredAt: new Date()
      };
      
      // Сохраняем пользователя в базе данных
      await addDoc(collection(db, "users"), newUser);
      setUser(newUser);
      
      // Показываем уведомление об успешной регистрации
      WebApp.showPopup({
        title: 'Успешная регистрация',
        message: 'Вы успешно зарегистрировались в анонимном чате!',
        buttons: [{text: "OK"}]
      });
      
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      WebApp.showPopup({
        title: 'Ошибка',
        message: 'Не удалось завершить регистрацию. Попробуйте позже.',
        buttons: [{text: "OK"}]
      });
    }
  };

  if (loading) {
    return <div className="container">Загрузка...</div>;
  }

  return (
    <div className="container">
      {!user ? (
        <RegistrationForm onSubmit={handleRegistration} />
      ) : (
        <div>
          <h1>Привет, {user.name || user.nickname}!</h1>
          <p>Вы успешно зарегистрированы. Скоро здесь появятся дополнительные функции.</p>
        </div>
      )}
    </div>
  );
}

export default App;
