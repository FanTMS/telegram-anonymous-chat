import React, { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { generateNickname } from '../utils/nickname';
import { useFormSteps } from '../hooks/useFormSteps';

const RegistrationForm = ({ onSubmit, telegramUser, isDevelopment = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        interests: '',
        aboutMe: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const nameInputRef = useRef(null);
    const ageInputRef = useRef(null);
    const interestsInputRef = useRef(null);
    const aboutMeInputRef = useRef(null);

    // Настраиваем многоэтапную форму (3 шага + страница успеха)
    const {
        currentStep,
        totalSteps,
        goToNextStep,
        goToPreviousStep,
        isFirstStep,
        isLastStep,
        stepClassName
    } = useFormSteps(3); // 3 шага формы

    // Предзаполняем имя и другие данные
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

        // Фокус на первом поле ввода с небольшой задержкой
        setTimeout(() => {
            nameInputRef.current?.focus();
        }, 500);
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

    // Валидация текущего шага перед переходом на следующий
    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 0: // Имя
                // Имя не обязательное (может быть заменено на псевдоним)
                break;
            case 1: // Возраст
                if (!formData.age) {
                    newErrors.age = 'Укажите ваш возраст';
                } else if (parseInt(formData.age) < 17) {
                    newErrors.age = 'Вам должно быть не менее 17 лет';
                }
                break;
            case 2: // Интересы
                if (!formData.interests) {
                    newErrors.interests = 'Укажите ваши интересы';
                } else if (formData.interests.length < 5) {
                    newErrors.interests = 'Расскажите подробнее о своих интересах';
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            goToNextStep();

            // Фокусируемся на следующем поле ввода с задержкой для анимации
            setTimeout(() => {
                switch (currentStep + 1) { // +1 потому что currentStep еще не обновился в этом блоке кода
                    case 1:
                        ageInputRef.current?.focus();
                        break;
                    case 2:
                        interestsInputRef.current?.focus();
                        break;
                    default:
                        break;
                }
            }, 300);
        }
    };

    const handlePreviousStep = () => {
        goToPreviousStep();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!validateStep(currentStep)) {
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

            // Показываем сообщение об успехе
            setShowSuccess(true);
        } catch (error) {
            console.error("Ошибка при отправке формы:", error);
            setErrors({ submit: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Изменяем заголовок и описание в зависимости от текущего шага
    const getStepTitle = () => {
        switch (currentStep) {
            case 0:
                return 'Как вас зовут?';
            case 1:
                return 'Сколько вам лет?';
            case 2:
                return 'Расскажите о себе';
            default:
                return 'Регистрация';
        }
    };

    const getStepDescription = () => {
        switch (currentStep) {
            case 0:
                return 'Можно оставить пустым для использования псевдонима';
            case 1:
                return 'Для участия в чате вам должно быть не менее 17 лет';
            case 2:
                return 'Это поможет нам найти для вас подходящих собеседников';
            default:
                return '';
        }
    };

    // Кастомизация MainButton от Telegram WebApp в зависимости от шага
    useEffect(() => {
        // Не используем MainButton в режиме разработки
        if (isDevelopment) return;

        try {
            if (isLastStep) {
                WebApp.MainButton.setText('Завершить регистрацию');
                WebApp.MainButton.onClick(handleSubmit);
            } else {
                WebApp.MainButton.setText('Далее');
                WebApp.MainButton.onClick(handleNextStep);
            }
            WebApp.MainButton.show();

            return () => {
                if (isLastStep) {
                    WebApp.MainButton.offClick(handleSubmit);
                } else {
                    WebApp.MainButton.offClick(handleNextStep);
                }
            };
        } catch (error) {
            console.warn("Не удалось настроить кнопку Telegram:", error);
        }
    }, [currentStep, formData, errors, isDevelopment, isLastStep]);

    // Если в процессе регистрации произошла ошибка
    if (errors.submit) {
        return (
            <div className="registration-error">
                <div className="error-icon">⚠️</div>
                <h2>Ошибка регистрации</h2>
                <p>{errors.submit}</p>
                <button
                    className="nav-button"
                    onClick={() => setErrors({ ...errors, submit: null })}
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    // Показываем страницу успешной регистрации
    if (showSuccess) {
        return (
            <div className="success-container">
                <div className="success-icon"></div>
                <h2 className="success-title">Регистрация завершена!</h2>
                <p className="success-message">
                    Вы успешно зарегистрировались в анонимном чате.
                    Теперь вы можете начать общение с другими участниками.
                </p>
                <div className="user-summary">
                    <div className="user-summary-row">
                        <div className="user-summary-label">Имя/Псевдоним:</div>
                        <div className="user-summary-value">
                            {formData.name ? formData.name : 'Будет использован псевдоним'}
                        </div>
                    </div>
                    <div className="user-summary-row">
                        <div className="user-summary-label">Возраст:</div>
                        <div className="user-summary-value">{formData.age}</div>
                    </div>
                    <div className="user-summary-row">
                        <div className="user-summary-label">Интересы:</div>
                        <div className="user-summary-value">{formData.interests}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="registration-form">
            {/* Заголовок формы */}
            <div className="form-header"></div>
            <h1>{getStepTitle()}</h1>
            <p>{getStepDescription()}</p>
        </div>

            {/* Индикаторы шагов */ }
    <div className="form-steps"></div>
    {
        [...Array(totalSteps)].map((_, index) => (
            <div
                key={index}
                className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
        ))
    }
            </div >

    {/* Форма с шагами */ }
    < form onSubmit = {(e) => e.preventDefault()}>
        {/* Шаг 1: Имя */ }
        < div className = { stepClassName(0) } >
            <div className="form-content">
                {telegramUser && (
                            <div className="telegram-user-info"></div>
                                <div className="tg-user-avatar">
                                    {telegramUser.first_name ? telegramUser.first_name.charAt(0) : 'T'}
                                </div>
                                <div className="tg-user-details">
                                    <p>{telegramUser.first_name} {telegramUser.last_name}</p>
                                    <p className="tg-user-id">Telegram ID: {telegramUser.id}</p>
                                </div>
                                {isDevelopment && telegramUser.is_dev_mode && (
                    <span className="dev-mode-tag">DEV</span>
                )}
            </div>
                        )}

                        <div className="floating-input-wrapper">
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder=" "
                                ref={nameInputRef}
                            />
                            <label htmlFor="name">Имя или псевдоним</label>
                        </div>

                        <p className="form-hint"></p>
                            Вы можете использовать своё имя или оставить поле пустым,
    система автоматически сгенерирует анонимный псевдоним.
                        </p >
                    </div >

                    <div className="form-navigation"></div>
                        <div></div> {/* Пустой блок для выравнивания */ }
<button
    type="button"
    className="nav-button"
    onClick={handleNextStep}
>
    <span className="button-text">Далее</span>
    <span>→</span>
</button>
                    </div >
                </div >

    {/* Шаг 2: Возраст */ }
    < div className = { stepClassName(1) } >
                    <div className="form-content">
                        <div className="floating-input-wrapper">
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                placeholder=" "
                                min="17"
                                ref={ageInputRef}
                            />
                            <label htmlFor="age">Ваш возраст</label>
                        </div>
                        {errors.age && <div className="error-text">{errors.age}</div>}
                        
                        <p className="form-hint">
                            Ваш возраст виден только модераторам и используется для 
                            безопасного подбора собеседников.
                        </p>
                    </div>

                    <div className="form-navigation">
                        <button
                            type="button"
                            className="nav-button back"
                            onClick={handlePreviousStep}
                        ></button>
                            <span>←</span>
                            <span className="button-text">Назад</span>
                        </button>
                        <button
                            type="button"
                            className="nav-button"
                            onClick={handleNextStep}
                        ></button>
                            <span className="button-text">Далее</span>
                            <span>→</span>
                        </button >
                    </div >
                </div >

    {/* Шаг 3: Интересы и о себе */ }
    < div className = { stepClassName(2) } >
        <div className="form-content">
            <div className="floating-input-wrapper">
                <textarea
                    id="interests"
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    placeholder=" "
                    ref={interestsInputRef}
                ></textarea>
                <label htmlFor="interests">Ваши интересы</label>
            </div>
            {errors.interests && <div className="error-text">{errors.interests}</div>}

            <div className="floating-input-wrapper">
                <textarea
                    id="aboutMe"
                    name="aboutMe"
                    value={formData.aboutMe}
                    onChange={handleChange}
                    placeholder=" "
                    ref={aboutMeInputRef}
                ></textarea>
                <label htmlFor="aboutMe">О себе (необязательно)</label>
            </div>

            <p className="form-hint"></p>
            Эта информация поможет нам подобрать для вас собеседников со схожими интересами.
        </p>
                    </div >

    <div className="form-navigation">
        <button
            type="button"
            className="nav-button back"
            onClick={handlePreviousStep}
        >
            <span>←</span>
            <span className="button-text">Назад</span>
        </button>
        <button
            type="button"
            className="nav-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
        >
            <span className="button-text">
                {isSubmitting ? 'Отправка...' : 'Завершить'}
            </span>
            {!isSubmitting && <span>✓</span>}
        </button>
    </div>
                </div >
            </form >

    {/* Индикатор загрузки при отправке формы */ }
{
    isSubmitting && (
        <div className="form-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Регистрация...</div>
        </div>
    )
}
        </div >
    );
};

export default RegistrationForm;
