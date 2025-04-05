import React, { useState, useEffect, useCallback, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { isBrowser, checkBrowserCompatibility } from '../utils/browserUtils';
import LoadingSpinner from './LoadingSpinner';
import SuccessScreen from './SuccessScreen';
import InterestSelector from './InterestSelector'; // Исправлено с InterestsSelector на InterestSelector
import EnhancedTextarea from './EnhancedTextarea'; // Замена AboutMeInput на EnhancedTextarea
import { INTERESTS } from '../config/appConfig';

const RegistrationForm = ({ onSubmit, telegramUser, isDevelopment = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        interests: [],
        aboutMe: ''
    });

    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const nameInputRef = useRef(null);
    const ageInputRef = useRef(null);
    const aboutMeInputRef = useRef(null);

    const totalSteps = 3;

    const goToNextStep = () => {
        setCurrentStep((prevStep) => Math.min(prevStep + 1, totalSteps - 1));
    };

    const goToPreviousStep = () => {
        setCurrentStep((prevStep) => Math.max(prevStep - 1, 0));
    };

    const isLastStep = currentStep === totalSteps - 1;

    const stepClassName = (step) => (step === currentStep ? 'active-step' : 'hidden-step');

    useEffect(() => {
        if (telegramUser?.first_name) {
            setFormData((prev) => ({
                ...prev,
                name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '')
            }));
        }

        if (isDevelopment) {
            setFormData((prev) => ({
                ...prev,
                age: prev.age || '25',
                interests: prev.interests || ['tech', 'books', 'music'],
                aboutMe: prev.aboutMe || 'Это тестовая запись для разработки приложения.'
            }));
        }

        if (isBrowser()) {
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 500);
        }
    }, [telegramUser, isDevelopment]);

    useEffect(() => {
        if (isBrowser()) {
            const isCompatible = checkBrowserCompatibility();
            if (!isCompatible && !isDevelopment) {
                setErrors((prev) => ({
                    ...prev,
                    submit: 'Ваш браузер не поддерживается. Пожалуйста, обновите его до последней версии.'
                }));
            }
        }
    }, [isDevelopment]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));

        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: null
            }));
        }
    };

    const handleInterestsChange = (selectedInterests) => {
        setFormData((prevData) => ({
            ...prevData,
            interests: selectedInterests
        }));

        if (errors.interests) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                interests: null
            }));
        }
    };

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

    const validateStep = useCallback((step) => {
        const newErrors = {};

        switch (step) {
            case 0:
                break;
            case 1:
                if (!formData.age) {
                    newErrors.age = 'Укажите ваш возраст';
                } else if (parseInt(formData.age) < 17) {
                    newErrors.age = 'Вам должно быть не менее 17 лет';
                }
                break;
            case 2:
                if (!formData.interests || formData.interests.length === 0) {
                    newErrors.interests = 'Выберите хотя бы один интерес';
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(async () => {
        const validationErrors = validateStep(currentStep);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const registrationLock = localStorage.getItem('registration_in_progress');
        if (registrationLock) {
            const lockTime = parseInt(registrationLock);
            const now = Date.now();

            if (now - lockTime < 30000) {
                console.log("Регистрация уже выполняется (установлена блокировка)");
                return;
            } else {
                localStorage.removeItem('registration_in_progress');
            }
        }

        setIsSubmitting(true);

        localStorage.setItem('registration_in_progress', Date.now().toString());

        try {
            let userData = { ...formData };

            if (formData.selectedInterests && formData.selectedInterests.length > 0) {
                const interestNames = formData.selectedInterests.map((interestId) => {
                    const interest = INTERESTS.find((i) => i.id === interestId);
                    return interest?.name;
                }).filter(Boolean);

                userData.interests = interestNames.join(', ');
            }

            console.log("Отправка данных формы:", userData);
            await onSubmit(userData);

            localStorage.removeItem('registration_in_progress');

            setShowSuccess(true);

        } catch (error) {
            console.error("Ошибка при отправке формы:", error);
            setErrors((prev) => ({
                ...prev,
                submit: error.message || "Произошла ошибка при регистрации"
            }));
            localStorage.removeItem('registration_in_progress');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, currentStep, validateStep, onSubmit]);

    useEffect(() => {
        if (isDevelopment || !isBrowser() || !WebApp.isSupported) return;

        try {
            if (isLastStep) {
                WebApp.MainButton.setText('Завершить регистрацию');
                WebApp.MainButton.onClick(handleSubmit);
            } else {
                WebApp.MainButton.setText('Далее');
                WebApp.MainButton.onClick(goToNextStep);
            }
            WebApp.MainButton.show();

            return () => {
                if (isLastStep) {
                    WebApp.MainButton.offClick(handleSubmit);
                } else {
                    WebApp.MainButton.offClick(goToNextStep);
                }
            };
        } catch (error) {
            console.warn("Не удалось настроить кнопку Telegram:", error);
        }
    }, [currentStep, isDevelopment, isLastStep, handleSubmit]);

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

    if (showSuccess) {
        return <SuccessScreen userData={formData} />;
    }

    return (
        <div className="registration-form">
            <div className="form-header">
                <h1>{getStepTitle()}</h1>
                <p>{getStepDescription()}</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className={stepClassName(0)}>
                    <div className="form-content">
                        <input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            ref={nameInputRef}
                        />
                    </div>
                    <button type="button" onClick={goToNextStep}>
                        Далее
                    </button>
                </div>

                <div className={stepClassName(1)}>
                    <div className="form-content">
                        <input
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            type="number"
                            ref={ageInputRef}
                        />
                    </div>
                    <button type="button" onClick={goToPreviousStep}>
                        Назад
                    </button>
                    <button type="button" onClick={goToNextStep}>
                        Далее
                    </button>
                </div>

                <div className={stepClassName(2)}>
                    <div className="form-content">
                        <InterestSelector
                            value={formData.interests}
                            onChange={handleInterestsChange}
                        />
                        <EnhancedTextarea
                            id="aboutMe"
                            name="aboutMe"
                            value={formData.aboutMe}
                            onChange={handleChange}
                            ref={aboutMeInputRef}
                        />
                    </div>
                    <button type="button" onClick={goToPreviousStep}>
                        Назад
                    </button>
                    <button type="button" onClick={handleSubmit}>
                        Завершить
                    </button>
                </div>
            </form>

            {isSubmitting && <LoadingSpinner text="Регистрация..." />}
        </div>
    );
};

export default RegistrationForm;