import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { generateNickname } from '../utils/nickname';

const RegistrationForm = ({ onSubmit, telegramUser, isDevelopment = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        interests: '',
        aboutMe: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Предзаполняем имя, если оно есть в данных Telegram
    useEffect(() => {
        if (telegramUser?.first_name) {
            setFormData(prev => ({
                ...prev,
                name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '')
            }));
        }

        // В режиме разработки предзаполняем поля для удобства тестирования
        if (isDevelopment) {
            setFormData(prev => ({
                ...prev,
                age: prev.age || '25',
                interests: prev.interests || 'Тестирование, разработка, программирование',
                aboutMe: prev.aboutMe || 'Это тестовая запись для разработки приложения.'
            }));
        }
    }, [telegramUser, isDevelopment]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));

        // Очистка ошибки при изменении поля
        if (errors[name]) {
            setErrors(prevErrors => ({
                ...prevErrors,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Проверка возраста
        if (!formData.age) {
            newErrors.age = 'Укажите ваш возраст';
        } else if (parseInt(formData.age) < 17) {
            newErrors.age = 'Вам должно быть не менее 17 лет';
        }

        // Проверка интересов
        if (!formData.interests) {
            newErrors.interests = 'Укажите ваши интересы';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            let userData = { ...formData };

            // Если имя не указано, генерируем псевдоним
            if (!userData.name.trim()) {
                userData.nickname = generateNickname();
            }

            // Конвертируем возраст в число
            userData.age = parseInt(userData.age);

            await onSubmit(userData);
        } catch (error) {
            console.error("Ошибка при отправке формы:", error);

            try {
                WebApp.showPopup({
                    title: 'Ошибка',
                    message: 'Произошла ошибка при отправке данных',
                    buttons: [{ text: "OK" }]
                });
            } catch (e) {
                // В режиме разработки WebApp методы могут не работать
                alert("Ошибка при отправке формы: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Настраиваем кнопку в MainButton Telegram или используем обычную кнопку в режиме разработки
    useEffect(() => {
        if (!isDevelopment) {
            try {
                WebApp.MainButton.setText('Зарегистрироваться');
                WebApp.MainButton.onClick(handleSubmit);
                WebApp.MainButton.show();

                return () => {
                    WebApp.MainButton.offClick(handleSubmit);
                };
            } catch (error) {
                console.warn("Не удалось настроить кнопку Telegram:", error);
            }
        }
    }, [formData, errors, isDevelopment]);

    return (
        <div>
            <h1>Регистрация</h1>
            <p>Для участия в анонимном чате, пожалуйста, заполните форму:</p>

            {telegramUser && (
                <div className="telegram-user-info">
                    <p>Вы вошли как пользователь Telegram с ID: {telegramUser.id}</p>
                    {isDevelopment && telegramUser.is_dev_mode && (
                        <p className="dev-mode-tag">Тестовый пользователь</p>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Имя (можно оставить пустым для использования псевдонима)</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Введите ваше имя или оставьте пустым"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="age">Возраст (от 17 лет) *</label>
                    <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Укажите ваш возраст"
                        required
                        min="17"
                    />
                    {errors.age && <div className="error-text">{errors.age}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="interests">Интересы *</label>
                    <textarea
                        id="interests"
                        name="interests"
                        value={formData.interests}
                        onChange={handleChange}
                        placeholder="Расскажите о ваших интересах"
                        required
                    />
                    {errors.interests && <div className="error-text">{errors.interests}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="aboutMe">О себе</label>
                    <textarea
                        id="aboutMe"
                        name="aboutMe"
                        value={formData.aboutMe}
                        onChange={handleChange}
                        placeholder="Расскажите немного о себе"
                    />
                </div>

                {/* Показываем кнопку только в режиме разработки */}
                {isDevelopment && (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="dev-submit-button"
                    >
                        {isSubmitting ? 'Отправка...' : 'Зарегистрироваться'}
                    </button>
                )}
                {!isDevelopment && (
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ display: 'none' }} // Скрываем кнопку, так как используем MainButton
                    >
                        Зарегистрироваться
                    </button>
                )}
            </form>
        </div>
    );
};

export default RegistrationForm;
