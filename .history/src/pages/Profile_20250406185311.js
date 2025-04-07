import React, { useState, useEffect, useCallback } from 'react';
import { updateUser, getUserById } from '../utils/userService';
import { safeHapticFeedback, safeShowPopup } from '../utils/telegramWebAppUtils';
import { getUserStatistics } from '../utils/statisticsService';
import InterestSelector from '../components/InterestSelector';
import '../styles/Profile.css';

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

const Profile = ({ user, onUpdate }) => {
    // Убедимся, что имеем актуальные данные
    const userId = user?.id;

    const [formData, setFormData] = useState({
        name: user?.name || '',
        age: user?.age || '',
        interests: user?.interests?.length > 0 ? user.interests : [],
        aboutMe: user?.aboutMe || ''
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

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Получаем идентификатор текущего пользователя
                const currentUserId = localStorage.getItem('current_user_id');
                
                if (!currentUserId) {
                    console.error('ID пользователя не найден в localStorage');
                    setError('Не удалось определить пользователя. Пожалуйста, войдите заново.');
                    setIsLoading(false);
                    return;
                }
                
                console.log('Загрузка профиля пользователя с ID:', currentUserId);
                
                // Пытаемся получить пользователя из localStorage
                const localUserData = localStorage.getItem('current_user');
                let userData = null;
                
                if (localUserData) {
                    try {
                        userData = JSON.parse(localUserData);
                        console.log('Данные пользователя из localStorage:', userData);
                    } catch (e) {
                        console.error('Ошибка при парсинге данных пользователя из localStorage:', e);
                    }
                }
                
                // Если нет данных в localStorage или данные устарели, запрашиваем с сервера
                if (!userData) {
                    console.log('Запрос данных пользователя из Firestore');
                    userData = await getUserById(currentUserId);
                    
                    if (!userData) {
                        console.error('Пользователь не найден в Firestore');
                        setError('Данный ID не зарегистрирован. Пожалуйста, войдите заново.');
                        setIsLoading(false);
                        
                        // Перенаправление на регистрацию через 3 секунды
                        setTimeout(() => {
                            navigate('/register');
                        }, 3000);
                        
                        return;
                    }
                }
                
                // Инициализируем форму с данными пользователя
                setFormData({
                    name: userData.name || '',
                    age: userData.age || '',
                    gender: userData.gender || '',
                    interests: userData.interests || '',
                    bio: userData.bio || ''
                });
                
                // Сохраняем статистику пользователя
                setUserStats({
                    chatsCount: userData.chatsCount || 0,
                    messagesCount: userData.messagesCount || 0,
                    rating: userData.rating || 0,
                    lastActive: userData.lastActive || new Date().toISOString()
                });
                
                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка при загрузке профиля:', error);
                setError('Произошла ошибка при загрузке профиля. Пожалуйста, попробуйте позже.');
                setIsLoading(false);
            }
        };

        loadUserProfile();
    }, []);

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Обработчик изменения интересов
    const handleInterestsChange = (selectedInterests) => {
        setFormData(prev => ({ ...prev, interests: selectedInterests }));
    };

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

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            if (!userId) {
                throw new Error('Пользователь не авторизован');
            }

            // Преобразуем данные для отправки на сервер
            const dataToUpdate = {
                ...formData,
                // Преобразуем массив id интересов в строку для API
                interests: formData.interests
            };

            await updateUser(userId, dataToUpdate);

            // Вызываем колбэк для обновления данных пользователя в родительском компоненте
            if (onUpdate) {
                onUpdate({
                    ...user,
                    ...dataToUpdate
                });
            }

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
                        <label>Интересы</label>
                        <InterestSelector
                            value={formData.interests}
                            onChange={handleInterestsChange}
                            maxSelections={5}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="aboutMe">О себе</label>
                        <textarea
                            id="aboutMe"
                            name="aboutMe"
                            className="tg-textarea"
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
                                <span className="info-label">Интересы:</span>
                                <div className="info-value">
                                    {formData.interests && formData.interests.length > 0 ? (
                                        <div className="interest-tags">
                                            {formatInterests().map((interest, index) => (
                                                <span key={index} className="interest-tag">
                                                    {interest.icon && <span style={{ marginRight: '4px' }}>{interest.icon}</span>}
                                                    {interest.name}
                                                </span>
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
