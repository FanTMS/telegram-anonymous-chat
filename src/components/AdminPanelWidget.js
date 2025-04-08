import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isUserAdminByTelegramId, isUserAdminByUID } from '../utils/adminManager';
import { getTelegramUser } from '../utils/telegramUtils';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/AdminPanelWidget.css';

const AdminPanelWidget = () => {
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                setLoading(true);
                
                // Проверяем, запущено ли приложение локально (всегда разрешено в локальной разработке)
                const isLocalhost =
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('192.168.');
                
                // В локальной разработке сразу считаем администратором
                if (isLocalhost) {
                    setIsAdmin(true);
                    setLoading(false);
                    return;
                }
                
                // Получаем данные пользователя из Telegram
                const telegramUser = getTelegramUser();
                
                if (telegramUser && telegramUser.id) {
                    // Проверяем, является ли пользователь специально указанным администратором
                    const telegramId = telegramUser.id.toString();
                    if (telegramId === '5394381166') {
                        console.log('Обнаружен главный администратор с ID 5394381166');
                        setIsAdmin(true);
                        setLoading(false);
                        return;
                    }
                    
                    // Проверяем права администратора по Telegram ID
                    const adminStatus = await isUserAdminByTelegramId(telegramId);
                    if (adminStatus) {
                        setIsAdmin(true);
                        setLoading(false);
                        return;
                    }
                }
                
                // Если не определили через Telegram, проверяем через Firebase Auth
                const unsubscribe = onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        // Проверяем конкретного пользователя по UID
                        if (user.uid === 'hSv7Bj222hMe13UlsvkQX0Phyaj2') {
                            console.log('Обнаружен главный администратор по UID');
                            setIsAdmin(true);
                            setLoading(false);
                            return;
                        }
                        
                        // Проверяем статус администратора по UID
                        const adminStatus = await isUserAdminByUID(user.uid);
                        setIsAdmin(adminStatus);
                    } else {
                        setIsAdmin(false);
                    }
                    setLoading(false);
                });
                
                return () => unsubscribe();
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
                setLoading(false);
            }
        };
        
        checkAdminStatus();
    }, []);

    if (loading || !isAdmin) return null;

    // Обрабатываем переход напрямую через window.location
    const handleAdminPanelClick = () => {
        console.log('Переход на панель администратора...');
        try {
            // Пробуем сначала штатную навигацию через react-router
            navigate('/admin');
            
            // Добавляем резервный вариант с таймаутом
            setTimeout(() => {
                // Если через 100мс мы все еще на той же странице, то делаем прямой переход
                if (!window.location.pathname.includes('/admin')) {
                    console.log('Принудительное перенаправление на /admin...');
                    window.location.href = '/admin';
                }
            }, 100);
        } catch (error) {
            console.error('Ошибка при переходе на панель администратора:', error);
            // Если что-то пошло не так, используем прямой переход
            window.location.href = '/admin';
        }
    };

    return (
        <div className="admin-panel-widget">
            <button 
                className="admin-panel-button"
                onClick={handleAdminPanelClick}
            >
                <i className="fas fa-shield-alt"></i>
                Панель администратора
            </button>
        </div>
    );
};

export default AdminPanelWidget; 