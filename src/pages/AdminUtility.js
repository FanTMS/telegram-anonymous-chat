import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addAdminByUID, isUserAdminByUID } from '../utils/adminManager';

const AdminUtility = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [adminStatus, setAdminStatus] = useState(null);
    
    // UID пользователя из запроса
    const specificUID = 'hSv7Bj222hMe13UlsvkQX0Phyaj2';
    const userName = 'Тихий_Мечтатель807';
    
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const isAdmin = await isUserAdminByUID(specificUID);
                setAdminStatus(isAdmin);
            } catch (error) {
                console.error('Ошибка при проверке статуса администратора:', error);
                setMessage('Ошибка при проверке статуса администратора: ' + error.message);
            }
        };
        
        checkAdminStatus();
    }, []);

    const handleGrantAdmin = async () => {
        setIsLoading(true);
        setMessage('');
        
        try {
            const success = await addAdminByUID(specificUID);
            
            if (success) {
                setMessage(`Пользователь "${userName}" (${specificUID}) успешно получил права администратора`);
                setAdminStatus(true);
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

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Утилита управления правами администратора</h1>
            
            <div style={{ 
                padding: '20px', 
                border: '1px solid #ccc', 
                borderRadius: '8px', 
                marginBottom: '20px',
                backgroundColor: '#f9f9f9'
            }}>
                <h2>Информация о пользователе</h2>
                <p><strong>Имя:</strong> {userName}</p>
                <p><strong>UID:</strong> {specificUID}</p>
                <p><strong>Статус администратора:</strong> {
                    adminStatus === null ? 'Проверка...' :
                    adminStatus ? 'Администратор' : 'Не администратор'
                }</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={handleGrantAdmin}
                    disabled={isLoading || adminStatus === true}
                    style={{
                        backgroundColor: '#d13639',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '12px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        opacity: (isLoading || adminStatus === true) ? 0.7 : 1
                    }}
                >
                    {isLoading ? 'Обработка...' : 
                     adminStatus === true ? 'Уже является администратором' : 
                     'Выдать права администратора'}
                </button>
            </div>
            
            {message && (
                <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#e8f4fd', 
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    {message}
                </div>
            )}
            
            <div>
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        backgroundColor: '#808080',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '10px 15px',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    Вернуться на главную
                </button>
            </div>
        </div>
    );
};

export default AdminUtility; 