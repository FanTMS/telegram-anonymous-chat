import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WebApp from '@twa-dev/sdk'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { InterestSelector } from '../components/InterestSelector'
import { useNotificationService } from '../utils/notifications'
import { createUserFromTelegram, createDemoUser, saveUser, User, getCurrentUser } from '../utils/user'
import { telegramApi } from '../utils/database'
import { userStorage } from '../utils/userStorage'
import { StepIcon } from '../components/RegistrationStepIcons'

// Расширяем интерфейс для кнопок
interface ExtendedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

// Создаем компонент кнопки с поддержкой загрузки
const LoadingButton: React.FC<ExtendedButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  variant,
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant={variant}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          Загрузка...
        </div>
      ) : children}
    </Button>
  );
};

export const Registration = () => {
  const navigate = useNavigate()
  const notifications = useNotificationService()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // Определяем направление анимации вне useEffect
  // Это решает проблему "Rendered more hooks than during the previous render"
  const [direction, setDirection] = useState(0)

  // Случайное имя для предзаполнения поля
  const [randomName] = useState(() => {
    const names = [
      'Алекс', 'Саша', 'Женя', 'Андрей', 'Максим',
      'Мария', 'Анна', 'Елена', 'Ника', 'Дарья'
    ]
    return names[Math.floor(Math.random() * names.length)]
  })

  // Всегда показываем кнопки, независимо от Telegram WebApp
  const [showCustomButton, setShowCustomButton] = useState(true);

  // Проверяем, авторизован ли уже пользователь
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = getCurrentUser()

        // Если пользователь уже существует, перенаправляем на главную
        if (currentUser) {
          navigate('/')
          return
        }

        // Проверяем наличие Telegram данных
        if (WebApp.isExpanded) {
          const initData = WebApp.initData

          if (initData && initData.length > 0) {
            // Пытаемся получить данные из Telegram
            await telegramApi.initialize()
            const telegramId = telegramApi.getUserId()

            if (telegramId) {
              // Пытаемся создать пользователя на основе данных из Telegram
              const user = await createUserFromTelegram()

              if (user) {
                // Если успешно, перенаправляем на главную
                WebApp.showPopup({
                  title: 'Авторизация успешна',
                  message: 'Вы успешно авторизованы через Telegram',
                  buttons: [{ type: 'ok' }]
                })
                navigate('/')
                return
              }
            }
          }
        }

        // Настраиваем MainButton
        if (WebApp.isExpanded) {
          WebApp.MainButton.setText('Продолжить')
          WebApp.MainButton.onClick(() => handleNext())
          WebApp.MainButton.show()
          WebApp.BackButton.hide()
        }

        setIsInitializing(false)
      } catch (error) {
        console.error('Ошибка при инициализации:', error)
        setIsInitializing(false)
      }
    }

    checkUser()

    // Очистка при размонтировании
    return () => {
      if (WebApp.isExpanded) {
        WebApp.MainButton.offClick(() => handleNext())
        WebApp.MainButton.hide()
      }
    }
  }, [navigate])

  // Определяем, доступно ли приложение в Telegram или мы в браузере
  useEffect(() => {
    try {
      // Более надежная проверка работоспособности WebApp
      const isTelegramWebAppFunctional =
        typeof WebApp !== 'undefined' &&
        WebApp.isExpanded &&
        WebApp.MainButton &&
        typeof WebApp.MainButton.onClick === 'function' &&
        typeof WebApp.MainButton.setText === 'function';

      if (isTelegramWebAppFunctional) {
        console.log('Telegram WebApp API доступен - настраиваем MainButton');
        // Даже если Telegram WebApp работает, мы всегда показываем наши кнопки
        // Но можем настроить MainButton дополнительно
        WebApp.MainButton.setText(step === 3 ? 'Завершить регистрацию' : 'Продолжить');
        WebApp.MainButton.onClick(handleNext);
        WebApp.MainButton.show();
      } else {
        console.log('Telegram WebApp API недоступен - используем пользовательские кнопки');
      }

      // Всегда показываем кнопки
      setShowCustomButton(true);
    } catch (error) {
      console.warn('Ошибка при проверке WebApp.MainButton:', error);
      setShowCustomButton(true);
    }
  }, [step]);

  // Обновляем надпись на кнопке и поведение назад в зависимости от шага
  useEffect(() => {
    try {
      if (WebApp && WebApp.isExpanded && WebApp.MainButton) {
        if (step > 1) {
          WebApp.BackButton.show()
          WebApp.BackButton.onClick(() => handleBack())
        } else {
          WebApp.BackButton.hide()
          WebApp.BackButton.offClick(() => handleBack())
        }

        if (step === 3) {
          WebApp.MainButton.setText('Завершить регистрацию')
        } else {
          WebApp.MainButton.setText('Продолжить')
        }
      }

      return () => {
        if (WebApp && WebApp.isExpanded) {
          WebApp.BackButton.offClick(() => handleBack())
        }
      }
    } catch (error) {
      console.warn('Ошибка при настройке MainButton:', error);
      // В случае ошибки, переключаемся на встроенные кнопки
      setShowCustomButton(true);
    }
  }, [step])

  // Обработчик кнопки "Назад"
  const handleBack = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(step - 1)
      // Обеспечиваем тактильную обратную связь
      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.impactOccurred('light')
      }
      setError(null)
    }
  }

  // Обработчик кнопки "Далее"
  const handleNext = () => {
    // Очищаем предыдущие ошибки
    setError(null)

    // Обеспечиваем тактильную обратную связь
    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.impactOccurred('medium')
    }

    if (step === 1) {
      // Проверяем, что имя указано или используем случайное
      if (!name) {
        setName(randomName)
      }
      setDirection(1)
      setStep(2)
    } else if (step === 2) {
      // Проверяем, что возраст указан
      if (!age) {
        setError('Пожалуйста, укажите ваш возраст')
        if (WebApp.isExpanded) {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
        return
      }

      // Проверяем, что возраст в допустимом диапазоне
      const ageNum = parseInt(age)
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
        setError('Возраст должен быть от 13 до 100 лет')
        if (WebApp.isExpanded) {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
        return
      }

      setError(null)
      setDirection(1)
      setStep(3)
    } else {
      // Проверяем, что выбраны интересы
      if (selectedInterests.length === 0) {
        setError('Пожалуйста, выберите хотя бы один интерес')
        if (WebApp.isExpanded) {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
        return
      }

      // Завершаем регистрацию
      handleCompleteRegistration()
    }
  }

  // Обработчик завершения регистрации
  const handleCompleteRegistration = async () => {
    setIsLoading(true);
    setError(null);

    // Показываем индикатор загрузки на MainButton
    if (WebApp.isExpanded) {
      WebApp.MainButton.showProgress();
    }

    try {
      let user: User | null = null;

      // Проверяем, есть ли данные Telegram
      if (telegramApi.isReady() && telegramApi.getUserId()) {
        // Создаем пользователя из данных Telegram - без передачи параметров
        user = createUserFromTelegram();
      } else {
        // Создаем демо-пользователя
        user = createDemoUser();
        user.name = name; // Обновляем имя
      }

      if (!user) {
        throw new Error('Не удалось создать пользователя');
      }

      // Обновляем данные пользователя
      user.age = parseInt(age);
      user.city = city || 'Не указан';
      user.interests = selectedInterests;

      // Сохраняем пользователя и проверяем результат
      const saveResult = saveUser(user);
      if (!saveResult) {
        throw new Error('Не удалось сохранить пользователя');
      }

      // Проверяем, что пользователь действительно сохранился
      const savedUser = getCurrentUser();
      console.log('User saved successfully:', savedUser);

      if (!savedUser) {
        throw new Error('Пользователь сохранён, но не может быть получен');
      }

      // Успешная вибрация
      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.notificationOccurred('success');
        WebApp.MainButton.hideProgress();
        WebApp.MainButton.hide();

        // Показываем уведомление об успешной регистрации
        WebApp.showPopup({
          title: 'Регистрация завершена',
          message: 'Ваш профиль успешно создан! Теперь вы можете пользоваться всеми функциями приложения.',
          buttons: [{
            type: 'ok',
            id: 'ok'
          }]
        }, () => {
          // Перенаправляем на главную
          navigate('/');
        });
      } else {
        // Для веб-версии просто показываем уведомление и перенаправляем
        notifications.showSuccess('Регистрация успешно завершена!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.');

      if (WebApp.isExpanded) {
        WebApp.MainButton.hideProgress();
        WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Отображение экрана загрузки
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
        <motion.div
          className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 dark:border-blue-500 dark:border-t-blue-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-600 dark:text-blue-400 font-medium">Загружаем приложение...</p>
        </motion.div>
      </div>
    )
  }

  // Варианты анимации для слайда
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 200 : -200,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900 text-gray-800 dark:text-gray-200 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Заголовок и лого */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-500">
            Добро пожаловать
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Создайте профиль для общения в анонимном чате</p>
        </motion.div>

        {/* Индикатор прогресса */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute top-6 left-10 right-10 h-1 bg-gray-200 dark:bg-gray-700 rounded">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded"
              initial={{ width: `${(step - 1) * 50}%` }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <div className="flex justify-between w-full px-6 z-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <StepIcon step={s} currentStep={step} />
                <div className="text-sm mt-2 text-center font-medium text-gray-600 dark:text-gray-400">
                  {s === 1 ? 'Знакомство' : s === 2 ? 'О вас' : 'Интересы'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          className="w-full mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 md:p-8 rounded-2xl bg-white/95 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
                className="w-full"
              >
                {/* Шаг 1: Имя */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                        👋
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Давайте познакомимся</h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Как вас зовут или как бы вы хотели, чтобы вас называли?
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">👤</span>
                      </div>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={`Например, ${randomName}`}
                        fullWidth
                        className="pl-10 bg-gray-50 dark:bg-gray-700 border-0 ring-1 ring-gray-200 dark:ring-gray-600 focus:ring-blue-500 rounded-lg py-3 text-lg"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                      <p>Вы можете использовать настоящее имя или псевдоним. Если оставите поле пустым, мы подберем случайное имя.</p>
                    </div>
                  </div>
                )}

                {/* Шаг 2: Возраст и город */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                        📝
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Расскажите о себе</h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Эта информация поможет найти собеседников с общими интересами
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Ваш возраст <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">🗓️</span>
                          </div>
                          <Input
                            value={age}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              setAge(value)
                            }}
                            placeholder="Сколько вам лет?"
                            fullWidth
                            type="number"
                            min={13}
                            max={100}
                            className="pl-10 bg-gray-50 dark:bg-gray-700 border-0 ring-1 ring-gray-200 dark:ring-gray-600 focus:ring-blue-500 rounded-lg py-3"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                          Возраст должен быть от 13 до 100 лет
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Ваш город <span className="text-gray-400">(необязательно)</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">🌆</span>
                          </div>
                          <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="В каком городе вы живете?"
                            fullWidth
                            className="pl-10 bg-gray-50 dark:bg-gray-700 border-0 ring-1 ring-gray-200 dark:ring-gray-600 focus:ring-blue-500 rounded-lg py-3"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Шаг 3: Интересы */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full mx-auto flex items-center justify-center text-4xl mb-4">
                        🌟
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ваши интересы</h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Выберите темы, которые вам интересны для лучшего подбора собеседников
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                      <InterestSelector
                        selectedInterests={selectedInterests}
                        onSelectInterest={(interests) => {
                          console.log('Выбранные интересы:', interests);
                          setSelectedInterests(interests);
                        }}
                        onChange={(interests) => {
                          console.log('Выбранные интересы (onChange):', interests);
                          setSelectedInterests(interests);
                        }}
                        maxSelections={5}
                      />
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 text-sm text-indigo-700 dark:text-indigo-300 flex items-start">
                      <span className="mr-2 text-lg">💡</span>
                      <p>Выберите хотя бы один интерес. Чем точнее выбор, тем более интересное общение вас ждет!</p>
                    </div>
                  </div>
                )}

                {/* Вывод ошибки */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center"
                    >
                      <span className="text-lg mr-2">⚠️</span>
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Кнопки навигации - ВСЕГДА показываем их */}
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {step > 1 ? (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="px-6 py-2.5 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="mr-2">←</span> Назад
                    </Button>
                  ) : (
                    <div></div> // Пустой div для выравнивания
                  )}

                  <LoadingButton
                    onClick={handleNext}
                    isLoading={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {step === 3 ? (
                      <>Завершить <span className="ml-2">✓</span></>
                    ) : (
                      <>Продолжить <span className="ml-2">→</span></>
                    )}
                  </LoadingButton>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Фиксированная кнопка внизу экрана - только для мобильных устройств */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg safe-area-bottom"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between max-w-md w-full mx-auto">
            {step > 1 ? (
              <Button
                onClick={handleBack}
                variant="outline"
                className="px-6 py-3 border-gray-300 dark:border-gray-600"
              >
                <span className="mr-2">←</span> Назад
              </Button>
            ) : (
              <div></div> // Пустой div для выравнивания
            )
            }

            <LoadingButton
              onClick={handleNext}
              isLoading={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold shadow-md rounded-lg"
            >
              {step === 3 ? 'Завершить ✓' : 'Продолжить →'}
            </LoadingButton>
          </div>
        </motion.div>

        {/* Нижняя информация */}
        <motion.div
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Регистрируясь, вы соглашаетесь с условиями использования сервиса</p>
        </motion.div>
      </div>
    </div>
  );
};
