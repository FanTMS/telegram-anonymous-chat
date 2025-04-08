import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { addAdminByTelegramId, isUserAdminByTelegramId } from '../utils/adminManager';
import '../styles/Admin.css';

const AdminConfig = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [telegramId, setTelegramId] = useState('');
    const [adminList, setAdminList] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Проверка авторизации администратора
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                setIsCheckingAuth(true);
                
                // Проверяем, запущено ли приложение локально (всегда разрешено в локальной разработке)
                const isLocalhost =
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('192.168.');
                
                if (isLocalhost) {
                    setIsAuthorized(true);
                } else {
                    // В продакшене проверяем права администратора
                    // тут можно добавить проверку прав через isAdmin или другую функцию
                    setIsAuthorized(false);
                }
                
                // Загружаем список администраторов
                await loadAdminList();
            } catch (error) {
                console.error('Ошибка при проверке статуса администратора:', error);
                setIsAuthorized(false);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAdminStatus();
    }, []);

    // Загрузка списка администраторов
    const loadAdminList = async () => {
        try {
            const configRef = doc(db, 'system', 'config');
            const configDoc = await getDoc(configRef);
            
            if (configDoc.exists() && configDoc.data().admins) {
                setAdminList(configDoc.data().admins);
            } else {
                setAdminList([]);
            }
        } catch (error) {
            console.error('Ошибка при загрузке списка администраторов:', error);
            setMessage('Ошибка при загрузке списка администраторов: ' + error.message);
        }
    };

    // Добавление нового администратора
    const handleAddAdmin = async () => {
        if (!telegramId || telegramId.trim() === '') {
            setMessage('Пожалуйста, введите Telegram ID');
            return;
        }
        
        setIsLoading(true);
        setMessage('');
        
        try {
            const success = await addAdminByTelegramId(telegramId);
            
            if (success) {
                setMessage(`Пользователь с Telegram ID ${telegramId} успешно добавлен как администратор`);
                setTelegramId('');
                await loadAdminList();
            } else {
                setMessage('Не удалось добавить администратора');
            }
        } catch (error) {
            console.error('Ошибка при добавлении администратора:', error);
            setMessage('Ошибка при добавлении администратора: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Проверка прав администратора
    const handleCheckAdmin = async () => {
        if (!telegramId || telegramId.trim() === '') {
            setMessage('Пожалуйста, введите Telegram ID');
            return;
        }
        
        setIsLoading(true);
        setMessage('');
        
        try {
            const isAdmin = await isUserAdminByTelegramId(telegramId);
            
            if (isAdmin) {
                setMessage(`Пользователь с Telegram ID ${telegramId} является администратором`);
            } else {
                setMessage(`Пользователь с Telegram ID ${telegramId} НЕ является администратором`);
            }
        } catch (error) {
            console.error('Ошибка при проверке прав администратора:', error);
            setMessage('Ошибка при проверке прав администратора: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Если проверка еще идет, показываем загрузку
    if (isCheckingAuth) {
        return (
            <div className="admin-loading">
                <h2>Проверка прав администратора...</h2>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Если пользователь не авторизован, показываем сообщение об ошибке
    if (!isAuthorized) {
        return (
            <div className="admin-unauthorized">
                <h2>Доступ запрещен</h2>
                <p>У вас нет прав для доступа к этой странице</p>
                <button
                    className="admin-back-button"
                    onClick={() => navigate('/home')}
                >
                    Вернуться на главную
                </button>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Управление администраторами</h1>
                <button
                    className="admin-back-button"
                    onClick={() => navigate('/admin')}
                >
                    Назад
                </button>
            </div>

            <div className="admin-panel">
                <div className="admin-form">
                    <h2>Добавить/проверить администратора</h2>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Telegram ID пользователя"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="admin-input"
                        />
                        <button
                            className="admin-button"
                            onClick={handleAddAdmin}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Добавление...' : 'Добавить'}
                        </button>
                        <button
                            className="admin-button secondary"
                            onClick={handleCheckAdmin}
                            disabled={isLoading}
                        >
                            Проверить
                        </button>
                    </div>
                    {message && <div className="admin-message">{message}</div>}
                </div>

                <div className="admin-list">
                    <h2>Список администраторов</h2>
                    {adminList.length === 0 ? (
                        <p>Администраторы не найдены</p>
                    ) : (
                        <ul className="admins-list">
                            {adminList.map(admin => (
                                <li key={admin} className="admin-item">
                                    <span className="admin-id">{admin}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminConfig; 