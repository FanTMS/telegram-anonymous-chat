import React, { useState, useEffect, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { generateNickname } from '../utils/nickname';
import { useFormSteps } from '../hooks/useFormSteps';
import StepIndicator from './StepIndicator'; import SuccessScreen from './SuccessScreen';
import LoadingSpinner from './LoadingSpinner';
import SuccessScreen from './SuccessScreen';

const RegistrationForm = ({ onSubmit, telegramUser, isDevelopment = false }) => {
    onForm = ({ onSubmit, telegramUser, isDevelopment = false }) => {
        const [formData, setFormData] = useState({
            etFormData] = useState({
                name: '',
                age: '', age: '',
                interests: '', interests: '',
                aboutMe: ''
    });

    const [errors, setErrors] = useState({}); te({ });
    const [isSubmitting, setIsSubmitting] = useState(false); ing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); seState(false);
    const nameInputRef = useRef(null);
            const ageInputRef = useRef(null); const ageInputRef = useRef(null);
            const interestsInputRef = useRef(null);
            const aboutMeInputRef = useRef(null); boutMeInputRef = useRef(null);

            // Настраиваем многоэтапную форму (3 шага + страница успеха)многоэтапную форму (3 шага + страница успеха)
            const {
                currentStep,
                totalSteps,
                goToNextStep, p,
                goToPreviousStep, tep,
                isFirstStep,
                isLastStep, isLastStep,
                stepClassName
            } = useFormSteps(3); // 3 шага формы3); // 3 шага формы

            // Предзаполняем имя и другие данныеданные
            useEffect(() => {
    if (telegramUser?.first_name) {
        setFormData(prev => ({ ormData(prev => ({
            ...prev, ...prev,
            name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '')                name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '')
        }));
    }

    // В режиме разработки предзаполняем поля для удобства тестированияаботки предзаполняем поля для удобства тестирования
    if (isDevelopment) {
        setFormData(prev => ({
            ...prev,
            age: prev.age || '25', age: prev.age || '25',
            interests: prev.interests || 'Тестирование, разработка, программирование', interests: prev.interests || 'Тестирование, разработка, программирование',
            aboutMe: prev.aboutMe || 'Это тестовая запись для разработки приложения.'                aboutMe: prev.aboutMe || 'Это тестовая запись для разработки приложения.'
        }));
    }

    // Фокус на первом поле ввода с небольшой задержкой на первом поле ввода с небольшой задержкой
    setTimeout(() => {
        nameInputRef.current?.focus(); nameInputRef.current?.focus();
    }, 500);
}, [telegramUser, isDevelopment]);

const handleChange = (e) => {
    (e) => {
        const { name, value } = e.target; ue
    } = e.target;
    setFormData(prevData => ({ ormData(prevData => ({
        ...prevData, ...prevData,
        [name]: value
    }));

// Очистка ошибки при изменении поляизменении поля
if (errors[name]) {
    setErrors(prevErrors => ({ rrors(prevErrors => ({
        ...prevErrors, ...prevErrors,
        [name]: null[name]: null
            }));
}));
        }
    };

// Валидация текущего шага перед переходом на следующий    // Валидация текущего шага перед переходом на следующий
const validateStep = (step) => {= (step) => {
    const newErrors = {}; { };

    switch (step) {{
            case 0: // Имя
// Имя не обязательное (может быть заменено на псевдоним)ое (может быть заменено на псевдоним)
break;
            case 1: // Возраст
if (!formData.age) {
    newErrors.age = 'Укажите ваш возраст'; newErrors.age = 'Укажите ваш возраст';
} else if (parseInt(formData.age) < 17) {
    if (parseInt(formData.age) < 17) {
        newErrors.age = 'Вам должно быть не менее 17 лет'; ge = 'Вам должно быть не менее 17 лет';
    }
    break;
            case 2: // Интересы
    if (!formData.interests) {
        newErrors.interests = 'Укажите ваши интересы'; newErrors.interests = 'Укажите ваши интересы';
    } else if (formData.interests.length < 5) {
        if (formData.interests.length < 5) {
            newErrors.interests = 'Расскажите подробнее о своих интересах'; newErrors.interests = 'Расскажите подробнее о своих интересах';
        }
        break; break;
            default:            default:
        break;
    }

    setErrors(newErrors); setErrors(newErrors);
    return Object.keys(newErrors).length === 0;rs).length === 0;
};

const handleNextStep = () => {
    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            goToNextStep();

            // Фокусируемся на следующем поле ввода с задержкой для анимации на следующем поле ввода с задержкой для анимации
            setTimeout(() => {
                switch (currentStep + 1) { // +1 потому что currentStep еще не обновился в этом блоке кодаtStep + 1) { // +1 потому что currentStep еще не обновился в этом блоке кода
                    case 1:
                        ageInputRef.current?.focus();
                        break;
                    case 2:
                        interestsInputRef.current?.focus(); stsInputRef.current?.focus();
                        break; break;
                    default: default:
                        break; break;
                }
            }
            }, 300);
    }, 300);
}
    };

const handlePreviousStep = () => {
    const handlePreviousStep = () => {
        goToPreviousStep();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); eventDefault();

        if (!validateStep(currentStep)) {
            if (!validateStep(currentStep)) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            let userData = { ...formData };
        };

        // Если имя не указано, генерируем псевдоним/ Если имя не указано, генерируем псевдоним
        if (!userData.name.trim()) {
            if (!userData.name.trim()) {
                userData.nickname = generateNickname(); eNickname();
            }

            // Конвертируем возраст в число число
            userData.age = parseInt(userData.age); userData.age = parseInt(userData.age);

            await onSubmit(userData);ta);

            // Показываем сообщение об успехе
            setShowSuccess(true);
        } catch (error) {ror) {
            console.error("Ошибка при отправке формы:", error);ри отправке формы: ", error);
            setErrors({ submit: error.message }); setErrors({ submit: error.message });
        } finally { } finally {
            setIsSubmitting(false); setIsSubmitting(false);
        }
        };

        // Изменяем заголовок и описание в зависимости от текущего шагаоловок и описание в зависимости от текущего шага
        const getStepTitle = () => {
            switch (currentStep) {rentStep) {
            case 0:
return 'Как вас зовут?';urn 'Как вас зовут?';
            case 1:
return 'Сколько вам лет?';rn 'Сколько вам лет?';
            case 2:
return 'Расскажите о себе'; return 'Расскажите о себе';
            default:      default:
return 'Регистрация'; return 'Регистрация';
        }
    };

const getStepDescription = () => {
    switch (currentStep) {rentStep) {
            case 0:
return 'Можно оставить пустым для использования псевдонима';urn 'Можно оставить пустым для использования псевдонима';
            case 1:
return 'Для участия в чате вам должно быть не менее 17 лет';rn 'Для участия в чате вам должно быть не менее 17 лет';
            case 2:
return 'Это поможет нам найти для вас подходящих собеседников'; return 'Это поможет нам найти для вас подходящих собеседников';
            default:      default:
return ''; return '';
        }
    };

// Кастомизация MainButton от Telegram WebApp в зависимости от шагаTelegram WebApp в зависимости от шага
useEffect(() => {
    useEffect(() => {
        // Не используем MainButton в режиме разработки используем MainButton в режиме разработки
        if (isDevelopment) return; turn;

        try {
            if (isLastStep) {stStep) {
        WebApp.MainButton.setText('Завершить регистрацию');ь регистрацию');
        WebApp.MainButton.onClick(handleSubmit);
    } else { else {
        WebApp.MainButton.setText('Далее'); Text('Далее');
        WebApp.MainButton.onClick(handleNextStep); WebApp.MainButton.onClick(handleNextStep);
    }
        WebApp.MainButton.show(); w();

        return () => {
            {
                if (isLastStep) {
                    WebApp.MainButton.offClick(handleSubmit); WebApp.MainButton.offClick(handleSubmit);
                } else { } else {
                    WebApp.MainButton.offClick(handleNextStep); p.MainButton.offClick(handleNextStep);
                }
            };
        };
    } catch (error) {
        console.warn("Не удалось настроить кнопку Telegram:", error); console.warn("Не удалось настроить кнопку Telegram:", error);
    }
}, [currentStep, formData, errors, isDevelopment, isLastStep]); mData, errors, isDevelopment, isLastStep]);

// Если в процессе регистрации произошла ошибкабка
if (errors.submit) {
    return (
            <div className="registration-error">on-error">
                <div className="error-icon">⚠️</div>assName="error-icon">⚠️</div>
                <h2>Ошибка регистрации</h2> >
                <p>{errors.submit}</p>
                <buttonbutton
                    className="nav-button"tton"
    onClick = {() => setErrors({ ...errors, submit: null })
} ck = {() => setErrors({ ...errors, submit: null })}
                >
    Попробовать снова          Попробовать снова
                </button >           </button >
            </div >            </div >
        );
    }

// Показываем страницу успешной регистрации
if (showSuccess) {
    return (
        <SuccessScreen
            formData={formData}
            message="Вы успешно зарегистрировались в анонимном чате. Теперь вы можете начать общение с другими участниками."
        />me = "registration-form" >
        );
}

return (
    <div className="registration-form">
        {/* Заголовок формы */}
        <div className="form-header"> шагов */}
            <h1>{getStepTitle()}</h1>rentStep={currentStep} />
            <p>{getStepDescription()}</p>
        </div>
        ={(e) => e.preventDefault()}>
        {/* Индикаторы шагов */}
        <div className="form-steps">
            {[...Array(totalSteps)].map((_, index) => (
                <StepIndicatorelegramUser && (
                    key = { index } < div className = "telegram-user-info" >
                    isActive= { index === currentStep}              <div className="tg-user-avatar">
                isCompleted={index < currentStep}                          {telegramUser.first_name ? telegramUser.first_name.charAt(0) : 'T'}
                    />                           </div>
                ))}                                <div className="tg-user-details">
            </div>                        <p>{telegramUser.first_name} {telegramUser.last_name}</p>
sName="tg-user-id">Telegram ID: {telegramUser.id}</p>
        {/* Форма с шагами */}iv>
        <form onSubmit={(e) => e.preventDefault()}>pment && telegramUser.is_dev_mode && (
            {/* Шаг 1: Имя */} className="dev-mode-tag">DEV</span>
        <div className={stepClassName(0)}>
            <div className="form-content">          </div>
            {telegramUser && (                        )}
            <div className="telegram-user-info">
                <div className="tg-user-avatar">floating-input-wrapper">
                    {telegramUser.first_name ? telegramUser.first_name.charAt(0) : 'T'}
                </div>        type="text"
                <div className="tg-user-details">"name"
                    <p>{telegramUser.first_name} {telegramUser.last_name}</p>
                    <p className="tg-user-id">Telegram ID: {telegramUser.id}</p>          value={formData.name}
                </div>             onChange={handleChange}
                {isDevelopment && telegramUser.is_dev_mode && (placeholder = " "
                    < span className="dev-mode-tag">DEV</span>                                ref={nameInputRef}
                                )}
        </div>ли псевдоним</label>
)}

                        <div className="floating-input-wrapper">
                            <inputльзовать своё имя или оставить поле пустым,
                                type="text"онимный псевдоним.
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder=" "
                                ref={nameInputRef}
                            />on"
                            <label htmlFor="name">Имя или псевдоним</label>
                        </div>

                        <p className="form-hint">className="button-text">Далее</span>
                            Вы можете использовать своё имя или оставить поле пустым, <span>→</span>
                            система автоматически сгенерирует анонимный псевдоним.                        </button >
                        </p >
                    </div >

    <div className="form-navigation">
        <div></div> {/* Пустой блок для выравнивания */}me(1)}>
        <button
            type="button" wrapper">
        className="nav-button"
        onClick={handleNextStep}
                        >  id="age"
        <span className="button-text">Далее</span>
        <span>→</span>  value={formData.age}
    </button>                                onChange = { handleChange }
                    </div >
                </div >

    {/* Шаг 2: Возраст */ } />
    <div className={stepClassName(1)}>  <label htmlFor="age">Ваш возраст</label>
        <div className="form-content">                        </div>
        <div className="floating-input-wrapper">="error-text">{errors.age}</div>}
        <input
            type="number" sName="form-hint">
            id="age"иден только модераторам и используется для
            name="age"беседников.
            value={formData.age}
            onChange={handleChange}>
            placeholder=" "
                                min="17"avigation">
            ref={ageInputRef}
                            />  type="button"
            <label htmlFor="age">Ваш возраст</label>      className="nav-button back"
    </div>                            onClick = { handlePreviousStep }
{ errors.age && <div className="error-text">{errors.age}</div> }

<p className="form-hint">n-text">Назад</span>
                            Ваш возраст виден только модераторам и используется для
                            безопасного подбора собеседников.
                        </p >
                    </div > av - button"
eNextStep}
<div className="form-navigation">
    <buttont">Далее</span>
type = "button"
className = "nav-button back"
onClick = { handlePreviousStep }
    >
                            <span>←</span>
                            <span className="button-text">Назад</span>ересы и о себе */}
                        </button >
                        <button                    <div className="form-content">
                            type="button"input-wrapper">
                            className="nav-button"
                            onClick={handleNextStep}
                        >    name="interests"
                            <span className="button-text">Далее</span>      value={formData.interests}
                            <span>→</span>                                onChange={handleChange}
                        </button>
                    </div > ref={ interestsInputRef }
                </div >
    Ваши интересы</label >
        {/* Шаг 3: Интересы и о себе */ }
        < div className = { stepClassName(2) } > errors.interests && <div className="error-text">{errors.interests}</div>}
<div className="form-content">
    <div className="floating-input-wrapper">
        <textareaarea
            id="interests" id="aboutMe"
            name="interests" utMe"
        value={formData.interests}outMe}
        onChange={handleChange}ge}
        placeholder=" "       placeholder=" "
        ref={interestsInputRef}
                            ></textarea>
    <label htmlFor="interests">Ваши интересы</label>l htmlFor="aboutMe">О себе (необязательно)</label>
                        </div > div >
    { errors.interests && <div className="error-text">{errors.interests}</div> }
    < p className = "form-hint" >
        <div className="floating-input-wrapper">ет нам подобрать для вас собеседников со схожими интересами.
            <textarea
                id="aboutMe"
                name="aboutMe"
                value={formData.aboutMe} orm-navigation">
            onChange={handleChange}
            placeholder=" "
            ref={aboutMeInputRef}
                            ></textarea>}
<label htmlFor="aboutMe">О себе (необязательно)</label>
                        </div >
    ame="button-text" > Назад</span >
        <p className="form-hint">
            Эта информация поможет нам подобрать для вас собеседников со схожими интересами.n
        </p>
                    </div > className="nav-button"

    < div className = "form-navigation" > { isSubmitting }
        < button
type = "button"utton - text">
className = "nav-button back"а...' : 'Завершить'}
onClick = { handlePreviousStep }
    > span >✓</span >}
                            <span>←</span>
                            <span className="button-text">Назад</span>
                        </button >
    <button
        type="button"
        className="nav-button" ормы */}
onClick = { handleSubmit }
disabled = { isSubmitting }
    >
    <span className="button-text">};
        {isSubmitting ? 'Отправка...' : 'Завершить'}
    </span>;
{ !isSubmitting && <span>✓</span> }                        </button >                    </div >                </div >            </form > {/* Индикатор загрузки при отправке формы */ }            { isSubmitting && (<div className="form-loading">                    <LoadingSpinner />                    <div className="loading-text">Регистрация...</div>                </div>) }        </div >    );}; export default RegistrationForm;