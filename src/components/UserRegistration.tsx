import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { Card } from './Card'
import { Input } from './Input'
import { InterestsSelector } from './InterestsSelector'
import { generateRandomNickname } from '../utils/interests'
import { createUserFromTelegram, createDemoUser, saveUser, User } from '../utils/user'
import { telegramApi } from '../utils/database'
import { motion, AnimatePresence } from 'framer-motion'

interface UserRegistrationProps {
  onComplete?: () => void;
}

// Расширяем интерфейс ButtonProps, чтобы добавить поддержку isLoading
interface ExtendedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

// Создаем расширенный компонент кнопки
const LoadingButton: React.FC<ExtendedButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Загрузка...
        </div>
      ) : children}
    </Button>
  );
};

export const UserRegistration: React.FC<UserRegistrationProps> = ({ onComplete }) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [randomName, setRandomName] = useState('')

  // Состояния для валидации
  const [ageError, setAgeError] = useState('')
  const [interestsError, setInterestsError] = useState('')

  // Генерируем случайное имя при загрузке компонента
  useEffect(() => {
    setRandomName(generateRandomNickname())
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
    }

    if (selectedInterests.length === 0) {
      setInterestsError('Выберите хотя бы один интерес')
      isValid = false
    }

    return isValid
  }

  // Обработчик завершения регистрации
  const handleCompleteRegistration = async () => {
    // Проверка валидации формы
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let user: User | null = null;

      // Проверяем, есть ли данные Telegram
      if (telegramApi.isReady() && telegramApi.getUserId()) {
        // Создаем пользователя из данных Telegram
        user = createUserFromTelegram();
      } else {
        // Создаем демо-пользователя
        user = createDemoUser();
        user.name = name || randomName; // Обновляем имя
      }

      if (!user) {
        throw new Error('Не удалось создать пользователя');
      }

      // Обновляем данные пользователя
      user.age = age ? parseInt(age) : undefined;
      user.interests = selectedInterests;

      // Сохраняем пользователя
      saveUser(user);

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
    } finally {
      setIsLoading(false);
    }
  };

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
                placeholder="Введите имя или оставьте пустым"
                value={name}
                onChange={handleNameChange}
                fullWidth
                className="border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg"
              />

              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-2 border-l-2 border-blue-300">
                Если оставите поле пустым, вы получите псевдоним: <span className="font-medium text-blue-500">{randomName}</span>
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
            <LoadingButton
              onClick={handleCompleteRegistration}
              isLoading={isLoading}
              fullWidth
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Завершить регистрацию
            </LoadingButton>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}
