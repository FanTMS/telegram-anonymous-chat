import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { Card } from './Card'
import { Input } from './Input'
import { InterestsSelector } from './InterestsSelector'
import { generateRandomNickname } from '../utils/interests'
import { createUserFromTelegram, createDemoUser, saveUser, User, addAdmin } from '../utils/user'
import { telegramApi } from '../utils/database'
import { motion } from 'framer-motion'
import WebApp from '@twa-dev/sdk'

interface UserRegistrationProps {
  onComplete?: () => void;
}

export const UserRegistration: React.FC<UserRegistrationProps> = ({ onComplete }) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [randomName, setRandomName] = useState('')
  const [telegramData, setTelegramData] = useState<any>(null)

  // Состояния для валидации
  const [ageError, setAgeError] = useState('')
  const [interestsError, setInterestsError] = useState('')

  // Получаем данные из Telegram и генерируем случайное имя при загрузке
  useEffect(() => {
    const initData = async () => {
      try {
        // Инициализируем Telegram API если еще не инициализирован
        if (!telegramApi.isReady()) {
          await telegramApi.initialize();
        }

        // Получаем данные пользователя из Telegram
        const userData = telegramApi.getUserData();
        setTelegramData(userData);

        // Если есть имя пользователя из Telegram, предзаполняем поле
        if (userData && userData.first_name) {
          setName(userData.first_name);
        } else {
          // Иначе генерируем случайное имя
          setRandomName(generateRandomNickname());
        }
      } catch (error) {
        console.error('Ошибка при получении данных из Telegram:', error);
        setRandomName(generateRandomNickname());
      }
    };

    initData();
  }, [])

  // Обработчик изменения имени
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  // Обработчик изменения возраста
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Разрешаем ввод только цифр без проверки диапазона при вводе
    const value = e.target.value.replace(/[^0-9]/g, '')
    setAge(value)

    // Проверяем диапазон только для отображения ошибки
    if (value === '') {
      setAgeError('')
    } else if (parseInt(value) < 13) {
      setAgeError('Возраст должен быть не менее 13 лет')
    } else if (parseInt(value) > 100) {
      setAgeError('Возраст должен быть не более 100 лет')
    } else {
      setAgeError('')
    }
  }

  // Обработчик выбора интересов
  const handleInterestsChange = (interests: string[]) => {
    setSelectedInterests(interests)
    if (interests.length > 0) {
      setInterestsError('')
    }
  }

  // Валидация перед отправкой формы
  const validateForm = () => {
    let isValid = true

    if (!age) {
      setAgeError('Пожалуйста, укажите ваш возраст')
      isValid = false
    } else if (parseInt(age) < 13) {
      setAgeError('Возраст должен быть не менее 13 лет')
      isValid = false
    } else if (parseInt(age) > 100) {
      setAgeError('Возраст должен быть не более 100 лет')
      isValid = false
    }

    if (selectedInterests.length === 0) {
      setInterestsError('Выберите хотя бы один интерес')
      isValid = false
    }

    return isValid
  }

  // Проверка, является ли текущий пользователь администратором по Telegram ID
  const checkAdminStatus = (telegramId: string): boolean => {
    try {
      // Проверяем специально сохраненный список Telegram ID администраторов
      const adminTelegramIds = localStorage.getItem('admin_telegram_ids');
      if (adminTelegramIds) {
        const adminIds = JSON.parse(adminTelegramIds);
        if (Array.isArray(adminIds) && adminIds.includes(telegramId)) {
          console.log(`Пользователь с Telegram ID ${telegramId} найден в списке администраторов`);
          return true;
        }
      }

      // Проверяем значение во временном хранилище
      const tempAdminId = localStorage.getItem('temp_current_admin');
      if (tempAdminId && tempAdminId === telegramId) {
        console.log(`Пользователь с Telegram ID ${telegramId} найден в временном хранилище администраторов`);
        return true;
      }

      // Проверяем основной список администраторов
      const admins = localStorage.getItem('admin_users');
      if (admins) {
        const adminList = JSON.parse(admins);
        if (Array.isArray(adminList) && adminList.includes(telegramId)) {
          console.log(`Пользователь с Telegram ID ${telegramId} найден в основном списке администраторов`);
          return true;
        }
      }

      // Проверка на целевого администратора
      const targetAdminId = '5394381166';
      if (telegramId === targetAdminId) {
        console.log(`Обнаружен целевой администратор с Telegram ID: ${telegramId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Ошибка при проверке статуса администратора:', error);
      return false;
    }
  }

  // Обработчик завершения регистрации
  const handleCompleteRegistration = async () => {
    // Проверка валидации формы
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let user: User | null = null
      const telegramId = telegramApi.getUserId();
      let isAdminUser = false;

      // Проверяем, есть ли данные Telegram
      if (telegramId) {
        console.log('Создание пользователя с Telegram ID:', telegramId);

        // Проверяем, является ли пользователь администратором
        isAdminUser = checkAdminStatus(telegramId);
        console.log(`Пользователь ${telegramId} администратор: ${isAdminUser}`);

        // Создаем пользователя из данных Telegram с уникальным ID
        user = await createUserFromTelegram(telegramId, name || randomName);

        // Если пользователь найден в списке администраторов, устанавливаем флаг
        if (user && isAdminUser) {
          user.isAdmin = true;
          console.log(`Установлен флаг isAdmin для пользователя ${user.name} (${user.id})`);

          // Также добавляем в общий список администраторов
          addAdmin(telegramId);
        }
      } else {
        // Создаем демо-пользователя только если не в Telegram
        console.log('Создание демо пользователя (не в Telegram)');
        user = createDemoUser(name || randomName);
      }

      if (!user) {
        throw new Error('Не удалось создать пользователя');
      }

      // Обновляем данные пользователя
      user.age = age ? parseInt(age) : undefined;
      user.interests = selectedInterests;

      // Сохраняем пользователя
      await saveUser(user);

      // Показываем сообщение об успехе в Telegram
      if (WebApp.isExpanded) {
        WebApp.showPopup({
          title: 'Регистрация успешна!',
          message: isAdminUser
            ? 'Профиль администратора создан. Теперь вы можете использовать все функции приложения.'
            : 'Ваш профиль создан. Теперь вы можете начать общение.',
          buttons: [{ type: 'ok' }]
        });
      }

      // Вызываем callback если он есть
      if (onComplete) {
        onComplete();
      } else {
        // Перенаправляем на главную
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.');

      if (WebApp.isExpanded) {
        WebApp.showPopup({
          title: 'Ошибка регистрации',
          message: 'Не удалось создать профиль. Пожалуйста, попробуйте еще раз.',
          buttons: [{ type: 'ok' }]
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="p-6 border border-blue-100 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-600">Добро пожаловать!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Пожалуйста, заполните информацию о себе, чтобы начать общение
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Input
                label="Имя или никнейм"
                placeholder={telegramData?.first_name ? "Оставьте имя из Telegram или измените" : "Введите имя или оставьте пустым"}
                value={name}
                onChange={handleNameChange}
                fullWidth
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-2 border-l-2 border-blue-300">
                {!name && telegramData?.first_name ?
                  `Будет использовано ваше имя из Telegram: ${telegramData.first_name}` :
                  `Если оставите поле пустым, вы получите псевдоним: ${randomName}`
                }
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Input
                label="Возраст"
                placeholder="Укажите ваш возраст"
                value={age}
                onChange={handleAgeChange}
                type="tel"
                min={13}
                max={100}
                required
                fullWidth
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
              />
              {ageError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {ageError}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium mb-2">Выберите интересы</label>
              <div className={`border rounded-md p-3 ${interestsError ? 'border-red-500' : 'border-gray-300'}`}>
                <InterestsSelector
                  selectedInterests={selectedInterests}
                  onChange={handleInterestsChange}
                  maxSelections={5}
                />
              </div>
              {interestsError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {interestsError}
                </motion.div>
              )}
            </motion.div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleCompleteRegistration}
              isLoading={isLoading}
              fullWidth
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Завершить регистрацию
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}
