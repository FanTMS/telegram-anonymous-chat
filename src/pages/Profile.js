import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { updateUser, getUserById } from '../utils/userService';
import '../styles/Profile.css';

const Profile = ({ user, onUpdate }) => {
    // Убедимся, что имеем актуальные данные
    const userId = user?.id;

    const [formData, setFormData] = useState({
        name: user?.name || '',
        age: user?.age || '',
        interests: user?.interests || '',
        aboutMe: user?.aboutMe || ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Загрузка актуальных данных профиля
    useEffect(() => {
        const loadUserData = async () => {
            try {
                if (!userId) {
                    console.warn("ID пользователя отсутствует");
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const userData = await getUserById(userId);

                if (userData) {
                    setFormData({
                        name: userData.name || '',
                        age: userData.age || '',
                        interests: userData.interests || '',
                        aboutMe: userData.aboutMe || ''
                    });
                }

                setIsLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки профиля:', err);
                setError('Не удалось загрузить данные профиля');
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [userId]);

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            if (!userId) {
                throw new Error('Пользователь не авторизован');
            }

            await updateUser(userId, formData);

            // Вызываем колбэк для обновления данных пользователя в родительском компоненте
            if (onUpdate) {
                onUpdate({
                    ...user,
                    ...formData
                });
            }

            // Тактильная обратная связь
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('success');
            }

            setIsEditing(false);
        } catch (err) {
            console.error('Ошибка сохранения профиля:', err);
            setError('Ошибка при сохранении данных');

            // Тактильная обратная связь при ошибке
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="profile-loading">Загрузка профиля...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'У'}
                </div>
                <h2 className="profile-title">{isEditing ? 'Редактирование профиля' : 'Мой профиль'}</h2>
            </div>

            {error && <div className="profile-error">{error}</div>}

            {isEditing ? (
                <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Имя/Псевдоним</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="tg-input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Как к вам обращаться"
                            maxLength={50}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="age">Возраст</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            className="tg-input"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Ваш возраст"
                            min={16}
                            max={99}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="interests">Интересы</label>
                        <input
                            type="text"
                            id="interests"
                            name="interests"
                            className="tg-input"
                            value={formData.interests}
                            onChange={handleChange}
                            placeholder="Ваши интересы через запятую"
                            maxLength={200}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="aboutMe">О себе</label>
                        <textarea
                            id="aboutMe"
                            name="aboutMe"
                            className="tg-input"
                            value={formData.aboutMe}
                            onChange={handleChange}
                            placeholder="Расскажите немного о себе"
                            rows={4}
                            maxLength={500}
                        />
                    </div>

                    <div className="profile-actions">
                        <button
                            type="button"
                            className="tg-button tg-button-secondary"
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="tg-button"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="profile-info">
                    <div className="info-card">
                        <div className="info-row">
                            <span className="info-label">Имя/Псевдоним:</span>
                            <span className="info-value">{formData.name || 'Не указано'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Возраст:</span>
                            <span className="info-value">{formData.age || 'Не указан'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Интересы:</span>
                            <div className="info-value">
                                {formData.interests ? (
                                    <div className="interest-tags">
                                        {formData.interests.split(',').map((tag, index) => (
                                            <span key={index} className="interest-tag">{tag.trim()}</span>
                                        ))}
                                    </div>
                                ) : (
                                    'Не указаны'
                                )}
                            </div>
                        </div>
                        {formData.aboutMe && (
                            <div className="info-row about-me-row">
                                <span className="info-label">О себе:</span>
                                <span className="info-value">{formData.aboutMe}</span>
                            </div>
                        )}
                    </div>
                    <button
                        className="tg-button edit-profile-button"
                        onClick={() => setIsEditing(true)}
                    >
                        Редактировать профиль
                    </button>
                </div>
            )}
        </div>
    );
};

export default Profile;
