import React, { useState, useEffect, useRef, useCallback } from 'react';
import { checkBrowserCompatibility, isBrowser } from '../utils/browserUtils';
import WebApp from '../config/webAppConfig';
import { generateNickname } from '../utils/nickname';
import { useFormSteps } from '../hooks/useFormSteps';
import StepIndicator from './StepIndicator';
import LoadingSpinner from './LoadingSpinner';
import SuccessScreen from './SuccessScreen';
import UserInfoCard from './UserInfoCard';
import AnimatedTransition from './AnimatedTransition';
import EnhancedInput from './EnhancedInput';
import EnhancedTextarea from './EnhancedTextarea';
import InterestSelector from './InterestSelector';

const RegistrationForm = ({ onSubmit, telegramUser, isDevelopment = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        interests: [],
        aboutMe: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const nameInputRef = useRef(null);
    const ageInputRef = useRef(null);
    const aboutMeInputRef = useRef(null);

    // Названия для шагов формы
    const stepLabels = ['Имя', 'Возраст', 'Интересы'];

    // Настраиваем многоэтапную форму
    const {
        currentStep,
        totalSteps,
        goToNextStep,
        goToPreviousStep,
        isLastStep,
        stepClassName,
        isFirstStep
    } = useFormSteps(3);

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
                interests: prev.interests || ['tech', 'books', 'music'],
                aboutMe: prev.aboutMe || 'Это тестовая запись для разработки приложения.'
            }));
        }

        // Фокус на первом поле ввода с небольшой задержкой
        if (isBrowser()) {
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 500);
        }
    }, [telegramUser, isDevelopment]);

    // Улучшенная обработка ошибок с проверкой совместимости браузера
    useEffect(() => {
        if (isBrowser()) {
            const isCompatible = checkBrowserCompatibility();
            if (!isCompatible && !isDevelopment) {
                setErrors(prev => ({
                    ...prev,
                    submit: 'Ваш браузер не поддерживается. Пожалуйста, обновите его до последней версии.'
                }));
            }
        }
    }, [isDevelopment, setErrors]);

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

    // Обработчик для выбора интересов
    const handleInterestsChange = (selectedInterests) => {
        setFormData(prevData => ({
            ...prevData,
            interests: selectedInterests
        }));

        // Очистка ошибки при изменении интересов
        if (errors.interests) {
            setErrors(prevErrors => ({
                ...prevErrors,
                interests: null
            }));
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
                return 'Выберите интересы';
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

    // Обработчик для кнопки "Назад"
    const handlePreviousStep = () => {
        goToPreviousStep();
    };

    // Валидация текущего шага перед переходом на следующий
    const validateStep = useCallback((step) => {
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
                if (!formData.interests || formData.interests.length === 0) {
                    newErrors.interests = 'Выберите хотя бы один интерес';
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, setErrors]);

    // Мемоизируем функции handleNextStep и handleSubmit, чтобы избежать ненужных ререндеров
    const memoizedHandleNextStep = React.useCallback(() => {
        if (validateStep(currentStep)) {
            goToNextStep();

            // Фокусируемся на следующем поле ввода с задержкой для анимации
            setTimeout(() => {
                switch (currentStep + 1) {
                    case 1:
                        ageInputRef.current?.focus();
                        break;
                    case 2:
                        // Интересы выбираются кликами, фокус не нужен
                        break;
                    default:
                        break;
                }
            }, 300);
        }
    }, [currentStep, validateStep, goToNextStep]);

    const memoizedHandleSubmit = useCallback(async () => {
        // Валидация последнего шага перед отправкой
        const validationErrors = validateStep(currentStep);
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        // Проверяем, не идет ли регистрация уже
        const registrationLock = localStorage.getItem('registration_in_progress');
        if (registrationLock) {
            const lockTime = parseInt(registrationLock);
            const now = Date.now();

            // Если блокировка установлена менее 30 секунд назад, не отправляем форму снова
            if (now - lockTime < 30000) {
                console.log("Регистрация уже выполняется (установлена блокировка)");
                return;
            } else {
                // Если блокировка старая, удаляем её
                localStorage.removeItem('registration_in_progress');
            }
        }

        setIsSubmitting(true);

        // Устанавливаем блокировку регистрации с текущим временем
        localStorage.setItem('registration_in_progress', Date.now().toString());

        try {
            let userData = { ...formData };
            
            // Если выбраны интересы, преобразуем их в строку
            if (formData.selectedInterests && formData.selectedInterests.length > 0) {
                const interestNames = formData.selectedInterests.map(interestId => {
                    const interest = INTERESTS.find(i => i.id === interestId);
                    return interest.name;
                }).filter(Boolean);

                userData.interests = interestNames.join(', ');
            }

            console.log("Отправка данных формы:", userData);
            await onSubmit(userData);

            // После успешной регистрации очищаем блокировку
            localStorage.removeItem('registration_in_progress');
            
            // Не показываем экран успеха сразу, пусть App.js обработает пользователя
            // setShowSuccess(true);

        } catch (error) {
            console.error("Ошибка при отправке формы:", error);
            setErrors(prev => ({
                ...prev,
                submit: error.message || "Произошла ошибка при регистрации"
            }));
            localStorage.removeItem('registration_in_progress');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, currentStep, validateStep, onSubmit, isSubmitting]);

    // Кастомизация MainButton от Telegram WebApp в зависимости от шага
    useEffect(() => {
        // Не используем MainButton в режиме разработки или если не в браузере
        if (isDevelopment || !isBrowser() || !WebApp.isSupported) return;

        try {
            if (isLastStep) {
                WebApp.MainButton.setText('Завершить регистрацию');
                WebApp.MainButton.onClick(memoizedHandleSubmit);
            } else {
                WebApp.MainButton.setText('Далее');
                WebApp.MainButton.onClick(memoizedHandleNextStep);
            }
            WebApp.MainButton.show();

            return () => {
                if (isLastStep) {
                    WebApp.MainButton.offClick(memoizedHandleSubmit);
                } else {
                    WebApp.MainButton.offClick(memoizedHandleNextStep);
                }
            };
        } catch (error) {
            console.warn("Не удалось настроить кнопку Telegram:", error);
        }
    }, [currentStep, formData, isDevelopment, isLastStep, memoizedHandleNextStep, memoizedHandleSubmit]);

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
        return <SuccessScreen userData={formData} />;
    }

    return (
        <div className="registration-form">
            {/* Заголовок формы */}
            <div className="form-header">
                <AnimatedTransition animation="slideInDown" duration={500}>
                    <h1>{getStepTitle()}</h1>
                </AnimatedTransition>
                <AnimatedTransition animation="slideInUp" duration={500} delay={100}>
                    <p>{getStepDescription()}</p>
                </AnimatedTransition>
            </div>

            {/* Индикаторы шагов */}
            <StepIndicator totalSteps={totalSteps} currentStep={currentStep} labels={stepLabels} />

            {/* Форма с шагами */}
            <form onSubmit={(e) => e.preventDefault()}>
                {/* Шаг 1: Имя */}
                <div className={stepClassName(0)}>
                    <div className="form-content">
                        {telegramUser && (
                            <AnimatedTransition animation="fadeIn" duration={500}>
                                <UserInfoCard user={telegramUser} isDevelopment={isDevelopment} />
                            </AnimatedTransition>
                        )}

                        <AnimatedTransition animation="slideInUp" duration={600} delay={200}>
                            <EnhancedInput
                                id="name"
                                name="name"
                                label="Имя или псевдоним"
                                value={formData.name}
                                onChange={handleChange}
                                ref={nameInputRef}
                                hint="Вы можете использовать своё имя или оставить поле пустым, система автоматически сгенерирует анонимный псевдоним."
                                icon="👤"
                                iconPosition="left"
                                iconSize="small"
                                className="input-with-padding"
                            />
                        </AnimatedTransition>
                    </div>

                    <div className="form-navigation">
                        <div></div> {/* Пустой блок для выравнивания */}
                        <button
                            type="button"
                            className="nav-button"
                            onClick={memoizedHandleNextStep}
                        >
                            <span className="button-text">Далее</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {/* Шаг 2: Возраст */}
                <div className={stepClassName(1)}>
                    <div className="form-content">
                        <AnimatedTransition animation="slideInUp" duration={600}>
                            <EnhancedInput
                                id="age"
                                name="age"
                                label="Ваш возраст"
                                value={formData.age}
                                onChange={handleChange}
                                type="number"
                                min="17"
                                ref={ageInputRef}
                                error={errors.age}
                                hint="Ваш возраст виден только модераторам и используется для безопасного подбора собеседников."
                                icon="🗓️"
                                iconPosition="left"
                                iconSize="small"
                                className="input-with-padding"
                            />
                        </AnimatedTransition>
                    </div>

                    <div className="form-navigation">
                        <button
                            type="button"
                            className="nav-button back-button"
                            onClick={handlePreviousStep}
                            disabled={isFirstStep || isSubmitting}
                        >
                            <span>←</span>
                            <span className="button-text">Назад</span>
                        </button>
                        <button
                            type="button"
                            className="nav-button"
                            onClick={memoizedHandleNextStep}
                        >
                            <span className="button-text">Далее</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {/* Шаг 3: Интересы и о себе */}
                <div className={stepClassName(2)}>
                    <div className="form-content">
                        <AnimatedTransition animation="fadeIn" duration={500}>
                            <h3 className="section-title">Выберите ваши интересы</h3>
                            <InterestSelector
                                value={formData.interests}
                                onChange={handleInterestsChange}
                                maxSelections={5}
                                error={errors.interests}
                                hint="Выбор интересов поможет подобрать собеседников со схожими увлечениями"
                            />
                        </AnimatedTransition>

                        <AnimatedTransition animation="slideInUp" duration={600} delay={300}>
                            <EnhancedTextarea
                                id="aboutMe"
                                name="aboutMe"
                                label="Расскажите о себе"
                                value={formData.aboutMe}
                                onChange={handleChange}
                                ref={aboutMeInputRef}
                                rows={3}
                                maxLength={200}
                                hint="Дополнительная информация о вас (необязательно)"
                                className="textarea-with-padding"
                            />
                        </AnimatedTransition>
                    </div>

                    <div className="form-navigation">
                        <button
                            type="button"
                            className="nav-button back-button"
                            onClick={handlePreviousStep}
                            disabled={isFirstStep || isSubmitting}
                        >
                            <span>←</span>
                            <span className="button-text">Назад</span>
                        </button>
                        <button
                            type="button"
                            className="nav-button"
                            onClick={memoizedHandleSubmit}
                            disabled={isSubmitting}
                        >
                            <span className="button-text">
                                {isSubmitting ? 'Отправка...' : 'Завершить'}
                            </span>
                            {!isSubmitting && <span>✓</span>}
                        </button>
                    </div>
                </div>
            </form>

            {/* Индикатор загрузки при отправке формы */}
            {isSubmitting && <LoadingSpinner text="Регистрация..." />}
        </div>
    );
};

export default RegistrationForm;