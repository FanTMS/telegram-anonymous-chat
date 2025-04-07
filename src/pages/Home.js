import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../styles/Home.css';
import AdminPanelWidget from '../components/AdminPanelWidget';

const Home = () => {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Fetch user data from Firestore
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        // Пользователь найден в базе данных
                        setUserData({
                            uid: user.uid,
                            displayName: userDoc.data().displayName || user.displayName,
                            ...userDoc.data()
                        });
                    } else {
                        // Пользователь не найден в базе данных - перенаправляем на регистрацию
                        console.error('Пользователь не найден в базе данных:', user.uid);
                        
                        // Очищаем данные перед переходом
                        localStorage.removeItem('current_user');
                        localStorage.removeItem('current_user_id');
                        
                        // Выходим из текущей сессии
                        await signOut(auth);
                        
                        // Показываем ошибку и перенаправляем на регистрацию
                        setError('Ваш профиль не найден. Необходимо зарегистрироваться.');
                        setTimeout(() => {
                            navigate('/register');
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setError('Ошибка загрузки данных пользователя');
                }
            } else {
                // Пользователь не аутентифицирован
                setUserData(null);
                navigate('/register');
            }
            setIsLoaded(true);
        });
        
        return () => unsubscribe();
    }, [navigate]);

    const handleNavigate = (path) => {
        navigate(path);
    };

    // Анимации для контейнеров
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    // Анимации для элементов внутри контейнеров
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1, y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24
            }
        }
    };

    if (!isLoaded) {
        return <div className="home-loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="home-error">
                <div className="error-icon">⚠️</div>
                <h2>Ошибка</h2>
                <p>{error}</p>
                <p>Перенаправление на страницу регистрации...</p>
            </div>
        );
    }

    return (
        <div className="home-container">
            <motion.div
                className="welcome-section"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1>Привет{userData?.displayName ? `, ${userData.displayName}` : ''}!</h1>
                <p>Добро пожаловать в анонимный чат Telegram</p>
            </motion.div>

            {/* Добавляем виджет администратора */}
            <AdminPanelWidget />

            <motion.div
                className="features-section"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="feature-card"
                    variants={itemVariants}
                    onClick={() => handleNavigate('/random-chat')}
                >
                    <div className="feature-icon">
                        <i className="fas fa-random"></i>
                    </div>
                    <div className="feature-content">
                        <h3>Случайный чат</h3>
                        <p>Найти случайного собеседника для общения</p>
                    </div>
                </motion.div>

                <motion.div
                    className="feature-card"
                    variants={itemVariants}
                    onClick={() => handleNavigate('/chats')}
                >
                    <div className="feature-icon">
                        <i className="fas fa-comments"></i>
                    </div>
                    <div className="feature-content">
                        <h3>Мои чаты</h3>
                        <p>Просмотр и управление активными чатами</p>
                    </div>
                </motion.div>

                <motion.div
                    className="feature-card"
                    variants={itemVariants}
                    onClick={() => handleNavigate('/profile')}
                >
                    <div className="feature-icon">
                        <i className="fas fa-user"></i>
                    </div>
                    <div className="feature-content">
                        <h3>Мой профиль</h3>
                        <p>Управление личными настройками и аватаром</p>
                    </div>
                </motion.div>

                <motion.div
                    className="feature-card"
                    variants={itemVariants}
                    onClick={() => handleNavigate('/guide')}
                >
                    <div className="feature-icon">
                        <i className="fas fa-book"></i>
                    </div>
                    <div className="feature-content">
                        <h3>Руководство</h3>
                        <p>Как пользоваться приложением и правила общения</p>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                className="about-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
            >
                <p>
                    Анонимный чат позволяет общаться с незнакомцами в защищенной среде Telegram.
                    Уважайте собеседников и следуйте правилам сообщества.
                </p>
            </motion.div>
        </div>
    );
};

export default Home;