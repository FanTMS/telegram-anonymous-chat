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

  // Случайное имя для предзаполнения поля
  const [randomName] = useState(() => {
    const names = [
      'Алекс', 'Саша', 'Женя', 'Андрей', 'Максим',
      'Мария', 'Анна', 'Елена', 'Ника', 'Дарья'
    ]
    return names[Math.floor(Math.random() * names.length)]
  })

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
              const user = await createUserFromTelegram(telegramId)

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

  // Обновляем надпись на кнопке и поведение назад в зависимости от шага
  useEffect(() => {
    if (!WebApp.isExpanded) return

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

    return () => {
      if (WebApp.isExpanded) {
        WebApp.BackButton.offClick(() => handleBack())
      }
    }
  }, [step])

  // Обработчик кнопки "Назад"
  const handleBack = () => {
    if (step > 1) {
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
    setIsLoading(true)
    setError(null)

    // Показываем индикатор загрузки на MainButton
    if (WebApp.isExpanded) {
      WebApp.MainButton.showProgress()
    }

    try {
      let user: User | null = null

      // Проверяем, есть ли данные Telegram
      if (telegramApi.isReady() && telegramApi.getUserId()) {
        // Создаем пользователя из данных Telegram
        user = await createUserFromTelegram(telegramApi.getUserId() as string, name)
      } else {
        // Создаем демо-пользователя
        user = createDemoUser()
        user.name = name // Обновляем имя
      }

      if (!user) {
        throw new Error('Не удалось создать пользователя')
      }

      // Обновляем данные пользователя
      user.age = parseInt(age)
      user.city = city || 'Не указан'
      user.interests = selectedInterests

      // Сохраняем пользователя и проверяем результат
      const saveResult = await saveUser(user)
      if (!saveResult) {
        throw new Error('Не удалось сохранить пользователя')
      }

      // Проверяем, что пользователь действительно сохранился
      const savedUser = getCurrentUser()
      console.log('User saved successfully:', savedUser)

      if (!savedUser) {
        throw new Error('Пользователь сохранён, но не может быть получен')
      }

      // Успешная вибрация
      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.notificationOccurred('success')
        WebApp.MainButton.hideProgress()
        WebApp.MainButton.hide()

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
          navigate('/')
        })
      } else {
        // Для веб-версии просто показываем уведомление и перенаправляем
        notifications.showSuccess('Регистрация успешно завершена!')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error)
      setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.')

      if (WebApp.isExpanded) {
        WebApp.MainButton.hideProgress()
        WebApp.HapticFeedback.notificationOccurred('error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Отображение экрана загрузки
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tg-theme-bg-color">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-tg-theme-button-color border-tg-theme-secondary-bg-color rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-tg-theme-hint-color">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-tg-theme-bg-color text-tg-theme-text-color p-4">
      <div className="max-w-md mx-auto">
        {/* Индикатор прогресса */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-3 left-0 right-0 h-1 bg-tg-theme-secondary-bg-color rounded">
            <motion.div
              className="h-full bg-tg-theme-button-color rounded"
              initial={{ width: `${(step - 1) * 50}%` }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {[1, 2, 3].map((s) => (
            <div key={s} className="relative z-10">
              <motion.div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${s <= step
                  ? 'bg-tg-theme-button-color text-white'
                  : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                  }`}
                animate={{
                  scale: s === step ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {s}
              </motion.div>
              <div className="text-xs mt-1 text-center text-tg-theme-hint-color">
                {s === 1 ? 'Имя' : s === 2 ? 'Инфо' : 'Интересы'}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-5 bg-tg-theme-secondary-bg-color border-0 shadow-sm">
              {/* Шаг 1: Имя */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-tg-theme-text-color">Давайте познакомимся</h1>
                    <p className="text-sm text-tg-theme-hint-color mt-1">
                      Как вас зовут или как бы вы хотели, чтобы вас называли?
                    </p>
                  </div>

                  <div className="text-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-tg-theme-button-color/10 mx-auto flex items-center justify-center text-2xl font-bold text-tg-theme-button-color">
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </div>
                  </div>

                  <div>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={`Например, ${randomName}`}
                      fullWidth
                      className="bg-tg-theme-bg-color text-tg-theme-text-color"
                    />
                    <p className="text-xs text-tg-theme-hint-color mt-1 text-center">
                      Вы можете использовать настоящее имя или псевдоним
                    </p>
                  </div>
                </div>
              )}

              {/* Шаг 2: Возраст и город */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-tg-theme-text-color">Основная информация</h1>
                    <p className="text-sm text-tg-theme-hint-color mt-1">
                      Расскажите немного о себе
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-tg-theme-hint-color">Ваш возраст</label>
                    <Input
                      value={age}
                      onChange={(e) => {
                        // Разрешаем только цифры
                        const value = e.target.value.replace(/\D/g, '')
                        setAge(value)
                      }}
                      placeholder="Укажите ваш возраст"
                      fullWidth
                      type="number"
                      min={13}
                      max={100}
                      className="bg-tg-theme-bg-color text-tg-theme-text-color"
                    />
                    <p className="text-xs text-tg-theme-hint-color mt-1">
                      Возраст должен быть от 13 до 100 лет
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-tg-theme-hint-color">Город (необязательно)</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ваш город"
                      fullWidth
                      className="bg-tg-theme-bg-color text-tg-theme-text-color"
                    />
                  </div>
                </div>
              )}

              {/* Шаг 3: Интересы */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-tg-theme-text-color">Ваши интересы</h1>
                    <p className="text-sm text-tg-theme-hint-color mt-1">
                      Выберите темы, которые вам интересны
                    </p>
                  </div>

                  <InterestSelector
                    selectedInterests={selectedInterests}
                    onSelectInterest={(interests) => setSelectedInterests(interests)}
                  />

                  <p className="text-xs text-tg-theme-hint-color mt-1 text-center">
                    Выберите хотя бы один интерес. Это поможет находить интересных собеседников
                  </p>
                </div>
              )}

              {/* Вывод ошибки */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Кнопки навигации (только для веб-версии, не для Telegram) */}
              {!WebApp.isExpanded && (
                <div className="flex justify-between mt-6">
                  {step > 1 ? (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="border-tg-theme-button-color text-tg-theme-button-color"
                    >
                      Назад
                    </Button>
                  ) : (
                    <div></div> // Пустой div для выравнивания
                  )}

                  <Button
                    onClick={handleNext}
                    isLoading={isLoading}
                    className="bg-tg-theme-button-color text-tg-theme-button-text-color"
                  >
                    {step === 3 ? 'Завершить' : 'Продолжить'}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
