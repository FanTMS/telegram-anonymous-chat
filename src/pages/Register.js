import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import RegistrationForm from '../components/RegistrationForm';
import { getWebAppTheme } from '../utils/telegramWebAppUtils';
import '../styles/Register.css';

const Register = () => {
    const [telegramUser, setTelegramUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState('light');
    const location = useLocation();
    const navigate = useNavigate();

    // Определение темы Telegram
    useEffect(() => {
        setTheme(getWebAppTheme());
    }, []);

    useEffect(() => {
        // Проверяем аутентификацию
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Перенаправляем, только если это не страница регистрации
                if (location.pathname === '/register') {
                    navigate('/home');
                }
            }
            setIsLoading(false);
        });

        // Проверяем Telegram данные
        const checkTelegramData = async () => {
            const params = new URLSearchParams(location.search);
            const initData = params.get('tgWebAppData');
            
            if (initData) {
                try {
                    // Парсим данные от Telegram
                    const telegramData = JSON.parse(atob(initData));
                    setTelegramUser(telegramData.user || null);
                } catch (error) {
                    console.error('Ошибка при обработке Telegram данных:', error);
                }
            }
        };

        checkTelegramData();
        
        return () => {
            unsubscribe();
        };
    }, [location, navigate]);

    // Варианты анимации для страницы
    const pageVariants = {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 }
    };

    // Отображаем загрузку
    if (isLoading) {
        return (
            <div className={`register-loading ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
                <div className="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <motion.div 
            className={`register-container ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.5 }}
        >
            <div className="register-content">
                <motion.div
                    className="register-header"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1>Добро пожаловать!</h1>
                    <p>Заполните профиль для начала общения в анонимном чате</p>
                </motion.div>
                
                <RegistrationForm telegramUser={telegramUser} />
            </div>
        </motion.div>
    );
};

export default Register; 