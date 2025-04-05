import React, { useState, useEffect, useCallback, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import '../styles/RegistrationForm.css';

// Интересы для выбора пользователем
const INTERESTS = [
  { id: 'music', name: 'Музыка', icon: '🎵' },
  { id: 'movies', name: 'Фильмы', icon: '🎬' },
  { id: 'travel', name: 'Путешествия', icon: '✈️' },
  { id: 'sports', name: 'Спорт', icon: '⚽' },
  { id: 'art', name: 'Искусство', icon: '🎨' },
  { id: 'gaming', name: 'Игры', icon: '🎮' },
  { id: 'cooking', name: 'Готовка', icon: '🍳' },
  { id: 'literature', name: 'Литература', icon: '📚' },
  { id: 'technology', name: 'Технологии', icon: '💻' },
  { id: 'fashion', name: 'Мода', icon: '👗' },
  { id: 'science', name: 'Наука', icon: '🔬' },
  { id: 'nature', name: 'Природа', icon: '🌿' },
  { id: 'photography', name: 'Фотография', icon: '📸' },
  { id: 'business', name: 'Бизнес', icon: '💼' },
  { id: 'health', name: 'Здоровье', icon: '🧘‍♂️' },
  { id: 'language', name: 'Языки', icon: '🗣️' },
  { id: 'dance', name: 'Танцы', icon: '💃' },
  { id: 'astrology', name: 'Астрология', icon: '✨' },
];

// Проверка, что мы в браузерном окружении
const isBrowser = () => typeof window !== 'undefined';

// Генерация случайного никнейма
const generateNickname = () => {
  const adjectives = [
    'Весёлый', 'Умный', 'Добрый', 'Мечтательный', 'Загадочный',
    'Элегантный', 'Креативный', 'Энергичный', 'Задумчивый', 'Волшебный'
  ];
  
  const nouns = [
    'Странник', 'Мыслитель', 'Художник', 'Искатель', 'Путешественник',
    'Исследователь', 'Мечтатель', 'Наблюдатель', 'Творец', 'Философ'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}_${noun}${Math.floor(Math.random() * 999)}`;
};

const RegistrationForm = ({ onSubmit, telegramUser = null, isDevelopment = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    selectedInterests: [],
    aboutMe: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Refs для полей ввода
  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const aboutMeInputRef = useRef(null);
  
  // Константы для шагов
  const totalSteps = 3;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  // Переход к следующему шагу
  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Переход к предыдущему шагу
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Обработка изменений в форме
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очищаем ошибку для данного поля при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Обработка выбора интересов
  const handleInterestsChange = (interestId) => {
    setFormData(prev => {
      const newSelectedInterests = [...prev.selectedInterests];
      
      if (newSelectedInterests.includes(interestId)) {
        return {
          ...prev,
          selectedInterests: newSelectedInterests.filter(id => id !== interestId)
        };
      } else {
        // Ограничиваем до 5 интересов
        if (newSelectedInterests.length < 5) {
          return {
            ...prev,
            selectedInterests: [...newSelectedInterests, interestId]
          };
        }
      }
      return prev;
    });
    
    // Очищаем ошибку интересов при изменении
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: undefined }));
    }
  };
  
  // Получение подсказки для текущего шага
  const getStepHint = () => {
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
  
  // Валидация текущего шага
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        // Имя не обязательно
        break;
      case 1:
        if (!formData.age) {
          newErrors.age = 'Укажите ваш возраст';
        } else if (parseInt(formData.age) < 17) {
          newErrors.age = 'Вам должно быть не менее 17 лет';
        }
        break;
      case 2:
        if (!formData.selectedInterests || formData.selectedInterests.length === 0) {
          newErrors.interests = 'Выберите хотя бы один интерес';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  // Обработчик отправки формы
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
      
      // Если имя не указано, генерируем псевдоним
      if (!userData.name?.trim()) {
        userData.nickname = generateNickname();
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
  
  // Эффект для взаимодействия с кнопкой Telegram WebApp
  useEffect(() => {
    if (isDevelopment || !isBrowser() || !WebApp.isSupported) return;
    
    try {
      if (isLastStep) {
        WebApp.MainButton.setText('Завершить регистрацию');
        WebApp.MainButton.onClick(handleSubmit);
      } else {
        WebApp.MainButton.setText('Далее');
        WebApp.MainButton.onClick(() => {
          if (validateStep(currentStep)) {
            goToNextStep();
          }
        });
      }
      WebApp.MainButton.show();
      
      return () => {
        if (isLastStep) {
          WebApp.MainButton.offClick(handleSubmit);
        } else {
          WebApp.MainButton.offClick(() => {
            if (validateStep(currentStep)) {
              goToNextStep();
            }
          });
        }
      };
    } catch (error) {
      console.warn("Не удалось настроить кнопку Telegram:", error);
    }
  }, [currentStep, isDevelopment, isLastStep, handleSubmit, validateStep]);
  
  // Эффект для фокуса на нужном поле при изменении шага
  useEffect(() => {
    setTimeout(() => {
      if (currentStep === 0 && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (currentStep === 1 && ageInputRef.current) {
        ageInputRef.current.focus();
      }
    }, 300);
  }, [currentStep]);
  
  // Если есть ошибка отправки формы, показываем экран ошибки
  if (errors.submit) {
    return (
      <div className="registration-error">
        <div className="error-icon">❌</div>
        <h2 className="error-title">Ошибка регистрации</h2>
        <p className="error-message">{errors.submit}</p>
        <button 
          className="retry-button"
          onClick={() => setErrors(prev => ({ ...prev, submit: undefined }))}
        >
          Попробовать снова
        </button>
      </div>
    );
  }
  
  // Компонент для отображения индикатора шага
  const StepIndicator = ({ step, label, isCurrent, isComplete }) => {
    const classes = ['step-indicator'];
    if (isCurrent) classes.push('active');
    if (isComplete) classes.push('completed');
    
    return (
      <div className="step-wrapper">
        <div className={classes.join(' ')}>
          {isComplete ? (
            <span className="step-check">✓</span>
          ) : (
            <span className="step-number">{step + 1}</span>
          )}
        </div>
        <span className="step-label">{label}</span>
      </div>
    );
  };
  
  // Определяем классы для шагов
  const getStepClass = (stepIndex) => {
    if (stepIndex === currentStep) return 'form-step active';
    if (stepIndex < currentStep) return 'form-step previous';
    return 'form-step';
  };
  
  // Если идет отправка формы, показываем индикатор загрузки
  if (isSubmitting) {
    return (
      <div className="registration-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Регистрация...</p>
      </div>
    );
  }
  
  // Рассчитываем ширину линии прогресса
  const progressWidth = `${((currentStep + 1) / totalSteps) * 100}%`;
  
  return (
    <div className="registration-container">
      <div className="form-header">
        <h1 className="form-title">Регистрация</h1>
      </div>
      
      {/* Индикаторы шагов */}
      <div className="form-progress">
        <div className="progress-line" style={{ width: progressWidth }}></div>
        <StepIndicator 
          step={0} 
          label="Имя" 
          isCurrent={currentStep === 0} 
          isComplete={currentStep > 0} 
        />
        <StepIndicator 
          step={1} 
          label="Возраст" 
          isCurrent={currentStep === 1} 
          isComplete={currentStep > 1} 
        />
        <StepIndicator 
          step={2} 
          label="Интересы" 
          isCurrent={currentStep === 2} 
          isComplete={false} 
        />
      </div>
      
      {/* Контейнер для шагов формы */}
      <div className="form-step-container">
        {/* Шаг 1: Имя */}
        <div className={getStepClass(0)}>
          <h2 className="form-title">Как вас зовут?</h2>
          <p className="form-subtitle">Введите имя или псевдоним</p>
          
          {telegramUser && (
            <div className="telegram-user-info">
              <div className="user-avatar">
                {telegramUser.photoUrl ? (
                  <img src={telegramUser.photoUrl} alt="avatar" />
                ) : (
                  telegramUser.firstName?.charAt(0)
                )}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {telegramUser.firstName} {telegramUser.lastName}
                </div>
                <div className="user-id">@{telegramUser.username || 'user'}</div>
              </div>
            </div>
          )}
          
          <div className="form-field">
            <div className="input-field with-icon">
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                ref={nameInputRef}
                placeholder=" "
                autoComplete="off"
              />
              <label htmlFor="name">Имя или псевдоним</label>
              <div className="input-icon">👤</div>
              {errors.name && <div className="input-error">{errors.name}</div>}
              <div className="input-hint">{getStepHint()}</div>
            </div>
          </div>
          
          <div className="form-navigation">
            <div style={{flex: 1}}></div>
            <button
              type="button"
              className="nav-button"
              onClick={() => {
                if (validateStep(currentStep)) goToNextStep();
              }}
            >
              <span className="button-text">Далее</span>
              <span>→</span>
            </button>
          </div>
        </div>
        
        {/* Шаг 2: Возраст */}
        <div className={getStepClass(1)}>
          <h2 className="form-title">Сколько вам лет?</h2>
          <p className="form-subtitle">Для безопасного общения</p>
          
          <div className="form-field">
            <div className="input-field with-icon">
              <input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                ref={ageInputRef}
                placeholder=" "
                min="17"
                max="99"
                autoComplete="off"
              />
              <label htmlFor="age">Ваш возраст</label>
              <div className="input-icon">🗓️</div>
              {errors.age && <div className="input-error">{errors.age}</div>}
              <div className="input-hint">{getStepHint()}</div>
            </div>
          </div>
          
          <div className="form-navigation">
            <button
              type="button"
              className="nav-button back-button"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
            >
              <span>←</span>
              <span className="button-text">Назад</span>
            </button>
            <button
              type="button"
              className="nav-button"
              onClick={() => {
                if (validateStep(currentStep)) goToNextStep();
              }}
              disabled={isSubmitting}
            >
              <span className="button-text">Далее</span>
              <span>→</span>
            </button>
          </div>
        </div>
        
        {/* Шаг 3: Интересы */}
        <div className={getStepClass(2)}>
          <h2 className="form-title">Ваши интересы</h2>
          <p className="form-subtitle">Выберите до 5 интересов</p>
          
          <div className="form-field">
            <div className="interests-grid">
              {INTERESTS.map((interest) => (
                <div
                  key={interest.id}
                  className={`interest-item ${formData.selectedInterests.includes(interest.id) ? 'selected' : ''}`}
                  onClick={() => handleInterestsChange(interest.id)}
                >
                  <div className="interest-icon">{interest.icon}</div>
                  <div className="interest-name">{interest.name}</div>
                  <div className="interest-select-indicator">✓</div>
                </div>
              ))}
            </div>
            {errors.interests && <div className="input-error">{errors.interests}</div>}
            <div className="input-hint">
              Выбрано: {formData.selectedInterests.length} / 5
            </div>
          </div>
          
          <div className="input-field">
            <textarea
              id="aboutMe"
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleChange}
              ref={aboutMeInputRef}
              rows={3}
              placeholder=" "
            ></textarea>
            <label htmlFor="aboutMe">О себе (необязательно)</label>
            {errors.aboutMe && <div className="input-error">{errors.aboutMe}</div>}
            <div className="input-hint">Расскажите немного о себе</div>
          </div>
          
          <div className="form-navigation">
            <button
              type="button"
              className="nav-button back-button"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
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
              <span className="button-text">Завершить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;