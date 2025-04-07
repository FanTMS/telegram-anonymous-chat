import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUser, getUserById } from '../utils/userService';
import { safeHapticFeedback, safeShowPopup } from '../utils/telegramWebAppUtils';
import { getUserStatistics } from '../utils/statisticsService';
import InterestSelector from '../components/InterestSelector';
import '../styles/Profile.css';
import { auth } from '../firebase';

// Предопределенные интересы для выбора
const PREDEFINED_INTERESTS = [
    { id: 'music', name: 'Музыка', icon: '🎵' },
    { id: 'sports', name: 'Спорт', icon: '⚽' },
    { id: 'gaming', name: 'Игры', icon: '🎮' },
    { id: 'movies', name: 'Кино', icon: '🎬' },
    { id: 'books', name: 'Книги', icon: '📚' },
    { id: 'travel', name: 'Путешествия', icon: '✈️' },
    { id: 'cooking', name: 'Кулинария', icon: '🍳' },
    { id: 'tech', name: 'Технологии', icon: '💻' },
    { id: 'art', name: 'Искусство', icon: '🎨' },
    { id: 'nature', name: 'Природа', icon: '🌲' },
    { id: 'science', name: 'Наука', icon: '🔬' },
    { id: 'history', name: 'История', icon: '🏛️' }
];

const Profile = () => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '',
        interests: [],
        bio: ''
    });

    const [userStats, setUserStats] = useState({
        totalChats: 0,
        completedChats: 0,
        totalMessages: 0,
        activeChats: 0
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Получаем идентификатор текущего пользователя из Firebase Auth
                const currentUser = auth.currentUser;
                const currentUserId = currentUser?.uid || localStorage.getItem('current_user_id');

                if (!currentUserId) {
                    console.error('ID пользователя не найден');
                    setError('Не удалось определить пользователя. Пожалуйста, войдите заново.');
                    redirectToRegistration();
                    return;
                }

                console.log('Загрузка профиля пользователя с ID:', currentUserId);

                // Проверяем наличие пользователя в Firestore
                const userDoc = await getUserById(currentUserId);
                
                if (!userDoc) {
                    console.error('Пользователь не найден в базе данных');
                    setError('Ваш профиль не найден. Необходимо зарегистрироваться.');
                    redirectToRegistration();
                    return;
                }

                // Инициализируем форму с данными пользователя из базы данных
                setFormData({
                    name: userDoc.name || '',
                    age: userDoc.age || '',
                    gender: userDoc.gender || '',
                    interests: userDoc.interests || [],
                    bio: userDoc.bio || userDoc.aboutMe || ''
                });

                // Сохраняем статистику пользователя
                setUserStats({
                    totalChats: userDoc.chatsCount || 0,
                    completedChats: userDoc.completedChatsCount || 0,
                    totalMessages: userDoc.messagesCount || 0,
                    activeChats: userDoc.activeChatsCount || 0
                });

                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка при загрузке профиля:', error);
                setError('Произошла ошибка при загрузке профиля. Пожалуйста, попробуйте позже.');
                setIsLoading(false);
            }
        };

        const redirectToRegistration = () => {
            setIsLoading(false);
            // Очищаем localStorage перед перенаправлением
            localStorage.removeItem('current_user');
            localStorage.removeItem('current_user_id');
            
            // Перенаправление на регистрацию через 2 секунды
            setTimeout(() => {
                navigate('/register');
            }, 2000);
        };

        loadUserProfile();
    }, [navigate]);

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Обработчик изменения интересов с использованием useCallback для стабильности
    const handleInterestsChange = useCallback((newInterests) => {
        setFormData(prev => ({
            ...prev,
            interests: newInterests
        }));
    }, []);

    // Получение инициалов пользователя для аватара
    const getUserInitials = () => {
        if (!formData.name) return '?';

        return formData.name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
    };

    // Форматирование интересов для отображения
    const formatInterests = useCallback(() => {
        if (!formData.interests || formData.interests.length === 0) {
            return [];
        }

        // Если interests - это массив id, преобразуем в массив объектов
        return formData.interests.map(interest => {
            if (typeof interest === 'string') {
                // Находим соответствующий интерес в предопределенных
                const predefined = PREDEFINED_INTERESTS.find(i => i.id === interest);
                return predefined || { id: interest, name: interest };
            }
            return interest;
        });
    }, [formData.interests]);

    // Отображение списка интересов пользователя
    const renderInterests = () => {
        if (!formData.interests) return null;

        // Проверяем, является ли interests массивом
        const interestsArray = Array.isArray(formData.interests)
            ? formData.interests
            : typeof formData.interests === 'string'
                ? formData.interests.split(',').map(interest => interest.trim())
                : [];

        if (interestsArray.length === 0) {
            return <div className="empty-interests">Интересы не указаны</div>;
        }

        return (
            <div className="interests-list">
                {interestsArray.map((interest, index) => {
                    // Если интерес - это объект, используем его name, иначе сам интерес
                    const interestName = typeof interest === 'object' ? interest.name : interest;
                    return (
                        <span key={index} className="interest-tag">
                            {interestName}
                        </span>
                    );
                })}
            </div>
        );
    };

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            // Получаем userId из Firebase Auth или из localStorage как запасной вариант
            const currentUser = auth.currentUser;
            const currentUserId = currentUser?.uid || localStorage.getItem('current_user_id');
            
            if (!currentUserId) {
                throw new Error('Пользователь не авторизован');
            }

            // Преобразуем данные для отправки в базу данных
            const dataToUpdate = {
                name: formData.name,
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender,
                interests: formData.interests,
                bio: formData.bio,
                updatedAt: new Date().toISOString()
            };

            // Сохраняем в Firestore
            await updateUser(currentUserId, dataToUpdate);

            // Тактильная обратная связь
            safeHapticFeedback('notification', null, 'success');

            // Показываем уведомление
            await safeShowPopup({
                title: 'Профиль обновлен',
                message: 'Ваш профиль успешно обновлен',
                buttons: [{ text: "ОК" }]
            });

            setIsEditing(false);
        } catch (err) {
            console.error('Ошибка сохранения профиля:', err);
            setError('Ошибка при сохранении данных');

            // Тактильная обратная связь при ошибке
            safeHapticFeedback('notification', null, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="profile-loading">
                <div className="profile-loading-spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar-wrapper">
                    <div className="profile-avatar">
                        {getUserInitials()}
                    </div>
                    {isEditing && (
                        <div className="profile-avatar-edit">✏️</div>
                    )}
                </div>
                <div className="profile-title-area">
                    <h2 className="profile-title">{isEditing ? 'Редактирование профиля' : formData.name || 'Мой профиль'}</h2>
                    <p className="profile-subtitle">
                        {formData.age ? `${formData.age} лет` : 'Возраст не указан'}
                    </p>
                </div>
            </div>

            {error && <div className="profile-error">{error}</div>}

            {!isEditing && (
                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-value">{userStats.totalChats || 0}</div>
                        <div className="stat-label">Всего чатов</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{userStats.completedChats || 0}</div>
                        <div className="stat-label">Завершено</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{userStats.totalMessages || 0}</div>
                        <div className="stat-label">Сообщений</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{userStats.activeChats || 0}</div>
                        <div className="stat-label">Активных</div>
                    </div>
                </div>
            )}

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
                            required
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
                        <label>Пол</label>
                        <div className="gender-selector">
                            <label className="gender-option">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={formData.gender === 'male'}
                                    onChange={handleChange}
                                />
                                <span>Мужской</span>
                            </label>
                            <label className="gender-option">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={formData.gender === 'female'}
                                    onChange={handleChange}
                                />
                                <span>Женский</span>
                            </label>
                            <label className="gender-option">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="other"
                                    checked={formData.gender === 'other'}
                                    onChange={handleChange}
                                />
                                <span>Другой</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Интересы</label>
                        <InterestSelector
                            value={formData.interests}
                            onChange={handleInterestsChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">О себе</label>
                        <textarea
                            id="bio"
                            name="bio"
                            className="tg-textarea"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Расскажите немного о себе"
                            rows={4}
                            maxLength={500}
                        />
                    </div>

                    <div className="form-actions">
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
                    <div className="profile-section">
                        <h3 className="profile-section-title">Личная информация</h3>
                        <div className="info-card">
                            <div className="info-row">
                                <span className="info-label">Имя/Псевдоним:</span>
                                <span className="info-value">{formData.name || 'Не указано'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Возраст:</span>
                                <span className="info-value">{formData.age ? `${formData.age} лет` : 'Не указан'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Пол:</span>
                                <span className="info-value">
                                    {formData.gender === 'male' ? 'Мужской' :
                                     formData.gender === 'female' ? 'Женский' :
                                     formData.gender === 'other' ? 'Другой' : 'Не указан'}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Интересы:</span>
                                <div className="info-value">
                                    {renderInterests()}
                                </div>
                            </div>
                            {formData.bio && (
                                <div className="info-row about-me-row">
                                    <span className="info-label">О себе:</span>
                                    <span className="info-value">{formData.bio}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="tg-button edit-profile-button"
                        onClick={() => {
                            safeHapticFeedback('selection');
                            setIsEditing(true);
                        }}
                    >
                        Редактировать профиль
                    </button>

                    <div className="app-info">
                        <div className="app-name">Анонимный чат</div>
                        <div className="app-version">Версия 1.0.0</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
