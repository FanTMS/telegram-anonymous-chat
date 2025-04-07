import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { collection, getDocs, query, limit, doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { createOrUpdateUser } from '../utils/userService';
import InterestSelector from './InterestSelector';
import { safeHapticFeedback, safeShowPopup, getWebAppTheme } from '../utils/telegramWebAppUtils';
import '../styles/RegistrationForm.css';

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

// Адъективы и существительные для генерации псевдонима
const adjectives = [
    'Веселый', 'Умный', 'Смелый', 'Добрый', 'Тихий', 'Громкий', 'Быстрый', 'Медленный',
    'Сильный', 'Мягкий', 'Яркий', 'Темный', 'Креативный', 'Мудрый', 'Находчивый'
];

const nouns = [
    'Путешественник', 'Исследователь', 'Мечтатель', 'Художник', 'Музыкант', 'Писатель',
    'Программист', 'Фотограф', 'Философ', 'Математик', 'Пекарь', 'Пилот', 'Архитектор'
];

// Функция для генерации случайного никнейма
const generateRandomNickname = () => {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${adjective}_${noun}${randomNumber}`;
};

const RegistrationForm = ({ telegramUser = null }) => {
    // Текущий шаг регистрации
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps] = useState(3);
    
    // Общие данные формы 
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'not_specified',
        selectedInterests: [],
        aboutMe: ''
    });
    
    // Состояния процесса регистрации
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [theme, setTheme] = useState('light');
    
    // Валидация
    const [validationErrors, setValidationErrors] = useState({});
    
    // Навигация
    const navigate = useNavigate();
    
    // Ссылки на элементы для анимации прокрутки
    const formContainerRef = useRef(null);
    
    // Добавляем ссылку для отслеживания активного поля ввода
    const activeInputRef = useRef(null);
    const inputRefs = useRef({
        name: null,
        age: null,
        aboutMe: null
    });
    
    // Определение темы Telegram
    useEffect(() => {
        setTheme(getWebAppTheme());
    }, []);
    
    // Проверка коллекций в Firebase
    useEffect(() => {
        const checkCollections = async () => {
            try {
                const collections = ['users', 'chats', 'messages', 'interests', 'searchQueue'];
                
                for (const collName of collections) {
                    const collRef = collection(db, collName);
                    try {
                        // Пытаемся получить документы из коллекции
                        await getDocs(query(collRef, limit(1)));
                    } catch (error) {
                        console.error(`Ошибка при проверке коллекции ${collName}:`, error);
                        // Пытаемся создать коллекцию, если она не существует
                        try {
                            // Создаем инициализирующий документ для создания коллекции
                            const initDocRef = doc(db, collName, '_init');
                            await setDoc(initDocRef, {
                                system: true,
                                createdAt: new Date().toISOString(),
                                description: `Initialization document for ${collName} collection`
                            });
                            console.log(`Коллекция ${collName} была создана`);
                        } catch (createError) {
                            console.error(`Не удалось создать коллекцию ${collName}:`, createError);
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при проверке коллекций:', error);
            }
        };
        
        checkCollections();
    }, []);
    
    // Прокрутка вверх при смене шага
    useEffect(() => {
        if (formContainerRef.current) {
            formContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [currentStep]);
    
    // Обработчики изменения полей формы
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        
        // Сохраняем активный элемент перед обновлением состояния
        activeInputRef.current = {
            name,
            selectionStart: e.target.selectionStart,
            selectionEnd: e.target.selectionEnd
        };
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Сбрасываем ошибку валидации при изменении поля
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    }, [validationErrors]);
    
    const handleInterestsChange = useCallback((selectedInterests) => {
        setFormData(prev => ({
            ...prev,
            selectedInterests
        }));
        
        // Сбрасываем ошибку валидации при изменении интересов
        if (validationErrors.interests) {
            setValidationErrors(prev => ({
                ...prev,
                interests: null
            }));
        }
    }, [validationErrors]);
    
    // Эффект для восстановления фокуса после обновления компонента
    useEffect(() => {
        if (activeInputRef.current) {
            const { name, selectionStart, selectionEnd } = activeInputRef.current;
            const inputElement = inputRefs.current[name];
            
            if (inputElement) {
                inputElement.focus();
                
                // Восстанавливаем позицию курсора, если это текстовое поле
                if (selectionStart !== undefined && selectionEnd !== undefined) {
                    try {
                        inputElement.setSelectionRange(selectionStart, selectionEnd);
                    } catch (e) {
                        // Игнорируем ошибки для элементов, не поддерживающих выделение
                    }
                }
            }
        }
    }, [formData]);
    
    // Валидация для каждого шага
    const validateStep = useCallback((step) => {
        const errors = {};
        
        switch (step) {
            case 1:
                // Проверка имени (опционально)
                break;
                
            case 2:
                // Проверка возраста (обязательно)
                if (!formData.age) {
                    errors.age = 'Возраст обязателен для заполнения';
                } else {
                    const age = parseInt(formData.age);
                    if (isNaN(age) || age < 17) {
                        errors.age = 'Минимальный возраст должен быть 17 лет';
                    } else if (age > 100) {
                        errors.age = 'Максимальный возраст не должен превышать 100 лет';
                    }
                }
                break;
                
            case 3:
                // Проверка интересов
                if (formData.selectedInterests.length < 1) {
                    errors.interests = 'Выберите хотя бы один интерес';
                }
                
                // Проверка описания
                if (formData.aboutMe && formData.aboutMe.length > 500) {
                    errors.aboutMe = 'Описание не должно превышать 500 символов';
                }
                break;
                
            default:
                break;
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);
    
    // Переход к следующему шагу
    const goToNextStep = useCallback(() => {
        // Проверяем валидность текущего шага
        if (!validateStep(currentStep)) {
            // Обратная связь об ошибке
            safeHapticFeedback('notification', null, 'error');
            return;
        }
        
        // Тактильная обратная связь
        safeHapticFeedback('selection');
        
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Отправляем форму на последнем шаге
            handleSubmit();
        }
    }, [currentStep, totalSteps, validateStep]);
    
    // Переход к предыдущему шагу
    const goToPrevStep = useCallback(() => {
        // Тактильная обратная связь
        safeHapticFeedback('selection');
        
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);
    
    // Отправка формы
    const handleSubmit = useCallback(async () => {
        console.log("Начало отправки формы...");
        
        // Валидация всей формы перед отправкой
        if (!validateStep(currentStep)) {
            console.log("Ошибки валидации при отправке формы:", validationErrors);
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Если имя не указано, генерируем псевдоним
            const nickname = formData.name.trim() || generateRandomNickname();
            if (!formData.name) {
                console.log('Имя не указано, сгенерирован псевдоним:', nickname);
            }
            
            // Создаем пользовательские данные
            const userData = {
                name: formData.name.trim() || nickname,
                displayName: formData.name.trim() || nickname,
                age: formData.age ? parseInt(formData.age) : null,
                gender: formData.gender,
                interests: formData.selectedInterests.map(interest => 
                    typeof interest === 'string' ? interest : interest.id),
                bio: formData.aboutMe,
                nickname,
                createdAt: new Date().toISOString(),
                status: 'active',
                telegramUser: telegramUser || null
            };
            
            console.log("Отправка данных формы:", userData);
            
            // Регистрируем анонимного пользователя
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;
            
            // Устанавливаем displayName
            await updateProfile(user, { displayName: nickname });
            
            // Сохраняем данные в Firestore
            await createOrUpdateUser(user.uid, userData);
            
            // Сохраняем текущий user объект в localStorage для сохранения авторизации
            localStorage.setItem('current_user', JSON.stringify({
                uid: user.uid,
                displayName: nickname,
                ...userData
            }));
            
            // Тактильная обратная связь об успехе
            safeHapticFeedback('notification', null, 'success');
            
            // Показываем уведомление об успехе
            setSuccess(true);
            
            // Показываем уведомление
            await safeShowPopup({
                title: 'Успешная регистрация',
                message: 'Ваша регистрация успешно завершена!',
                buttons: [{ text: "Начать" }]
            });
            
            // Перенаправляем на главную страницу
            navigate('/home');
        } catch (err) {
            console.error('Ошибка при регистрации:', err);
            setError(err.message || 'Произошла ошибка при регистрации');
            
            // Тактильная обратная связь при ошибке
            safeHapticFeedback('notification', null, 'error');
            
            try {
                // Показываем уведомление об ошибке
                await safeShowPopup({
                    title: 'Ошибка регистрации',
                    message: err.message || 'Произошла ошибка при регистрации',
                    buttons: [{ text: "Понятно" }]
                });
            } catch (popupError) {
                console.error('Ошибка при показе уведомления:', popupError);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, currentStep, navigate, telegramUser, validateStep, validationErrors]);
    
    // Расчет прогресса заполнения формы
    const calculateProgress = () => {
        return Math.max(33, (currentStep / totalSteps) * 100);
    };

    // Мемоизированные компоненты шагов формы для предотвращения перерисовки при вводе
    const StepWelcomeComponent = memo(({ formData, handleChange, goToNextStep, isSubmitting, inputRefs }) => (
        <div className="form-content">
            <h2 className="form-title">Давайте познакомимся</h2>
            <p className="form-subtitle">Как к вам обращаться?</p>
            
            <div className="form-field">
                <div className="input-field with-icon">
                    <i className="input-icon fas fa-user"></i>
                    <input 
                        type="text" 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Введите ваше имя или псевдоним"
                        maxLength={50}
                        ref={el => inputRefs.current.name = el}
                    />
                    <label htmlFor="name">Имя или псевдоним</label>
                </div>
                <p className="input-hint">Имя необязательно. Если оставите пустым, мы сгенерируем уникальный псевдоним.</p>
            </div>

            <div className="form-navigation">
                <button 
                    className="nav-button next-button"
                    onClick={goToNextStep}
                    disabled={isSubmitting}
                >
                    <span className="button-text">Далее</span>
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    ));

    const StepPersonalInfoComponent = memo(({ formData, validationErrors, handleChange, goToNextStep, goToPrevStep, isSubmitting, inputRefs }) => (
        <div className="form-content">
            <h2 className="form-title">Немного о вас</h2>
            <p className="form-subtitle">Эта информация поможет найти собеседников</p>
            
            <div className="form-field">
                <div className="input-field with-icon">
                    <i className="input-icon fas fa-birthday-cake"></i>
                    <input 
                        type="number" 
                        id="age" 
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Введите ваш возраст"
                        min={17}
                        max={100}
                        required
                        ref={el => inputRefs.current.age = el}
                    />
                    <label htmlFor="age">Возраст<span className="required-mark">*</span></label>
                </div>
                {validationErrors.age && (
                    <p className="input-error">{validationErrors.age}</p>
                )}
            </div>
            
            <div className="form-field">
                <label className="select-label">Пол</label>
                <div className="gender-select">
                    <div 
                        className={`gender-option ${formData.gender === 'male' ? 'selected' : ''}`}
                        onClick={() => handleChange({ target: { name: 'gender', value: 'male' } })}
                    >
                        <i className="fas fa-mars"></i>
                        <span>Мужской</span>
                    </div>
                    <div 
                        className={`gender-option ${formData.gender === 'female' ? 'selected' : ''}`}
                        onClick={() => handleChange({ target: { name: 'gender', value: 'female' } })}
                    >
                        <i className="fas fa-venus"></i>
                        <span>Женский</span>
                    </div>
                    <div 
                        className={`gender-option ${formData.gender === 'not_specified' ? 'selected' : ''}`}
                        onClick={() => handleChange({ target: { name: 'gender', value: 'not_specified' } })}
                    >
                        <i className="fas fa-genderless"></i>
                        <span>Не указывать</span>
                    </div>
                </div>
            </div>

            <div className="form-navigation">
                <button 
                    className="nav-button back-button"
                    onClick={goToPrevStep}
                    disabled={isSubmitting}
                >
                    <i className="fas fa-arrow-left"></i>
                    <span className="button-text">Назад</span>
                </button>
                <button 
                    className="nav-button next-button"
                    onClick={goToNextStep}
                    disabled={isSubmitting}
                >
                    <span className="button-text">Далее</span>
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    ));

    const StepInterestsAndBioComponent = memo(({ formData, validationErrors, handleChange, handleInterestsChange, goToPrevStep, handleSubmit, isSubmitting, inputRefs }) => (
        <div className="form-content">
            <h2 className="form-title">Интересы и о себе</h2>
            <p className="form-subtitle">Расскажите, что вам интересно</p>
            
            <div className="form-field">
                <label>Выберите интересы (до 5)</label>
                <InterestSelector
                    value={formData.selectedInterests}
                    onChange={handleInterestsChange}
                />
                {validationErrors.interests && (
                    <p className="input-error">{validationErrors.interests}</p>
                )}
            </div>
            
            <div className="form-field">
                <div className="input-field textarea-field">
                    <textarea
                        id="aboutMe"
                        name="aboutMe"
                        value={formData.aboutMe}
                        onChange={handleChange}
                        placeholder="Расскажите немного о себе (необязательно)"
                        rows={4}
                        maxLength={500}
                        ref={el => inputRefs.current.aboutMe = el}
                    ></textarea>
                    <label htmlFor="aboutMe">О себе</label>
                </div>
                <div className="char-counter">
                    {formData.aboutMe ? formData.aboutMe.length : 0}/500
                </div>
                {validationErrors.aboutMe && (
                    <p className="input-error">{validationErrors.aboutMe}</p>
                )}
            </div>

            <div className="form-navigation">
                <button 
                    className="nav-button back-button"
                    onClick={goToPrevStep}
                    disabled={isSubmitting}
                >
                    <i className="fas fa-arrow-left"></i>
                    <span className="button-text">Назад</span>
                </button>
                <button 
                    className="nav-button next-button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    <span className="button-text">
                        {isSubmitting ? 'Регистрация...' : 'Завершить'}
                    </span>
                    {!isSubmitting && <i className="fas fa-check"></i>}
                </button>
            </div>
        </div>
    ));

    // Вспомогательные компоненты для шагов формы с анимацией
    const StepWelcome = () => (
        <motion.div 
            className="form-step active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            key="step-welcome"
        >
            <StepWelcomeComponent 
                formData={formData}
                handleChange={handleChange}
                goToNextStep={goToNextStep}
                isSubmitting={isSubmitting}
                inputRefs={inputRefs}
            />
        </motion.div>
    );
    
    const StepPersonalInfo = () => (
        <motion.div 
            className="form-step active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            key="step-personal-info"
        >
            <StepPersonalInfoComponent
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                goToNextStep={goToNextStep}
                goToPrevStep={goToPrevStep}
                isSubmitting={isSubmitting}
                inputRefs={inputRefs}
            />
        </motion.div>
    );
    
    const StepInterestsAndBio = () => (
        <motion.div 
            className="form-step active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            key="step-interests-bio"
        >
            <StepInterestsAndBioComponent
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                handleInterestsChange={handleInterestsChange}
                goToPrevStep={goToPrevStep}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                inputRefs={inputRefs}
            />
        </motion.div>
    );
    
    // Компонент успешной регистрации
    const SuccessStep = () => (
        <motion.div 
            className="registration-success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="success-icon">✓</div>
            <h2>Регистрация завершена!</h2>
            <p>Добро пожаловать в анонимный чат Telegram</p>
            <motion.button
                className="complete-registration-button"
                onClick={() => navigate('/home')}
                whileTap={{ scale: 0.95 }}
            >
                Начать общение
            </motion.button>
        </motion.div>
    );
    
    // Компонент ошибки регистрации
    const ErrorStep = () => (
        <motion.div 
            className="registration-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="error-icon">⚠️</div>
            <h2>Ошибка регистрации</h2>
            <p>{error || 'Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.'}</p>
            <motion.button
                className="retry-button"
                onClick={() => {
                    setError(null);
                    setCurrentStep(1);
                }}
                whileTap={{ scale: 0.95 }}
            >
                Попробовать снова
            </motion.button>
        </motion.div>
    );
    
    // Компонент для отображения активного шага формы
    const getStepContent = () => {
        if (success) return <SuccessStep key="success" />;
        if (error) return <ErrorStep key="error" />;
        
        // Возвращаем нужный шаг в зависимости от currentStep
        switch (currentStep) {
            case 1:
                return <StepWelcome key="step1" />;
            case 2:
                return <StepPersonalInfo key="step2" />;
            case 3:
                return <StepInterestsAndBio key="step3" />;
            default:
                return null;
        }
    };

    // Основной рендер
    return (
        <div 
            className={`registration-container ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
            ref={formContainerRef}
        >
            {!success && !error && (
                <div className="form-header">
                    <div className="form-progress">
                        {Array.from({ length: totalSteps }).map((_, index) => (
                            <div className="step-wrapper" key={index}>
                                <div 
                                    className={`step-indicator ${
                                        index + 1 === currentStep ? 'active' : 
                                        index + 1 < currentStep ? 'completed' : ''
                                    }`}
                                >
                                    {index + 1 < currentStep ? (
                                        <span className="step-check">✓</span>
                                    ) : (
                                        <span className="step-number">{index + 1}</span>
                                    )}
                                </div>
                                <span className="step-label">
                                    {index === 0 ? 'Имя' : 
                                     index === 1 ? 'Личное' : 'Интересы'}
                                </span>
                            </div>
                        ))}
                        <div 
                            className="progress-line" 
                            style={{ width: `${calculateProgress() - 33}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            <div className="form-step-container">
                <AnimatePresence mode="wait" initial={false}>
                    {getStepContent()}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RegistrationForm;