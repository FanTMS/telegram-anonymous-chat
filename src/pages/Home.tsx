import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { NavButton } from '../components/NavButton'
import { isAdmin, getCurrentUser, User } from '../utils/user'
import { getUserCurrency } from '../utils/store'
import { motion, AnimatePresence } from 'framer-motion'
import { UserRegistration } from '../components/UserRegistration'
import { InterestsSelector } from '../components/InterestsSelector'
import { startSearching, stopSearching, isUserSearching, startMatchmakingService, stopMatchmakingService, markChatNotificationAsRead, hasNewChat, getNewChatNotification, createDemoUserForMatching, triggerMatchmaking } from '../utils/matchmaking'

// Интерфейс для режима поиска
type SearchMode = 'interests' | 'random';

// Компонент для анимированной кнопки (заменяет AnimatedButton, так как его файл отсутствует)
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
  animation?: 'pulse' | 'scale' | 'bounce';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  fullWidth = false,
  className = '',
  animation = 'pulse'
}) => {
  // Определяем анимацию в зависимости от типа
  const getAnimation = () => {
    switch (animation) {
      case 'pulse':
        return { scale: [1, 1.03, 1], transition: { duration: 1.5, repeat: Infinity } };
      case 'scale':
        return { scale: 1.03, transition: { duration: 0.2 } };
      case 'bounce':
        return { y: [0, -5, 0], transition: { duration: 1, repeat: Infinity } };
      default:
        return {};
    }
  };

  return (
    <motion.button
      className={`px-4 py-3 rounded-lg font-medium ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={onClick}
      whileHover={getAnimation()}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
};

// Компонент для рекомендаций пользователей (заменяет RecommendedUsers, так как его файл отсутствует)
interface RecommendedUsersProps {
  limit?: number;
  showFilter?: boolean;
  onSelectUser: (user: User) => void;
}

const RecommendedUsers: React.FC<RecommendedUsersProps> = ({
  limit = 3,
  showFilter = false,
  onSelectUser
}) => {
  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-3">Рекомендуемые собеседники</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        На основе ваших интересов и предпочтений
      </p>
      <Button
        onClick={() => onSelectUser({
          id: 'recommended-1',
          name: 'Рекомендованный пользователь',
          interests: ['Музыка', 'Спорт'],
          isAnonymous: true,
          rating: 4.5,
          createdAt: Date.now(),
          lastActive: Date.now()
        })}
        fullWidth
        className="mb-2"
        variant="secondary"
      >
        Найти рекомендованных собеседников
      </Button>
    </Card>
  );
};

export const Home = () => {
  const navigate = useNavigate()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const isDarkTheme = WebApp.colorScheme === 'dark'
  const [isRegistered, setIsRegistered] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<SearchMode>('random')
  const [searchDuration, setSearchDuration] = useState(0)
  const [matchmakingServiceId, setMatchmakingServiceId] = useState<number | null>(null)
  const searchTimerRef = useRef<number | null>(null)
  const [foundChatId, setFoundChatId] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Проверяем, является ли пользователь администратором и существует ли пользователь
  useEffect(() => {
    try {
      const user = getCurrentUser()
      setCurrentUser(user)
      setIsRegistered(!!user)

      if (user) {
        const userCurrency = getUserCurrency(user.id)
        setUserBalance(userCurrency.balance)
        setShowRegistration(false)

        // Проверяем, не находится ли пользователь уже в поиске
        const searching = isUserSearching(user.id)
        setIsSearching(searching)

        // Если пользователь уже в поиске, запускаем таймер и сервис
        if (searching) {
          startSearchTimer()
          startMatchmaking()
        }
      } else {
        // Если пользователь не существует, показываем форму регистрации
        setShowRegistration(true)
      }

      const adminStatus = isAdmin()
      setIsAdminUser(adminStatus)
    } catch (e) {
      console.error('Failed to check user status', e)
    }

    // Очистка при размонтировании
    return () => {
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current)
      }
      if (matchmakingServiceId) {
        stopMatchmakingService(matchmakingServiceId)
      }
      if (window._newChatCheckInterval) {
        clearInterval(window._newChatCheckInterval);
        delete window._newChatCheckInterval;
      }
    }
  }, [])

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (hasNewChat(currentUser.id)) {
        const notification = getNewChatNotification(currentUser.id);
        if (notification && !notification.isRead) {
          setFoundChatId(notification.chatId);
        }
      }
    }
  }, []);

  const handleGoToProfile = () => {
    navigate('/direct/profile')
  }

  const handleGoToHelp = () => {
    navigate('/beginner-guide');  // Изменено с '/direct/help' на '/beginner-guide'
  }

  const handleGoToAdmin = () => {
    navigate('/direct/admin')
  }

  const handleFindRandomGroup = () => {
    navigate('/groups')
  }

  const handleFindRandomChat = () => {
    navigate('/direct/chat')
  }

  const handleGoToBot = () => {
    navigate('/bot-chat')
  }

  const handleGoToChats = () => {
    navigate('/chats')
  }

  const handleGoToSettings = () => {
    navigate('/settings')
  }

  // Обработчик завершения регистрации
  const handleRegistrationComplete = () => {
    // Анимируем переход
    const user = getCurrentUser()
    setCurrentUser(user)
    setIsRegistered(true)

    // Анимация: сначала скрываем форму регистрации, затем показываем главную страницу
    setShowRegistration(false)

    if (user) {
      const userCurrency = getUserCurrency(user.id)
      setUserBalance(userCurrency.balance)
    }
  }

  // Обработчик выбора рекомендованного пользователя
  const handleSelectRecommendedUser = (user: User) => {
    // Переходим к чату с выбранным пользователем
    navigate(`/direct/chat`)
  }

  // Обработчик выбора интересов
  const handleInterestsChange = (interests: string[]) => {
    setSelectedInterests(interests)
  }

  // Запуск таймера поиска
  const startSearchTimer = () => {
    setSearchDuration(0)

    // Очищаем предыдущий таймер, если он был
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current)
    }

    // Запускаем новый таймер
    searchTimerRef.current = window.setInterval(() => {
      setSearchDuration(prev => prev + 1)
    }, 1000)
  }

  // Остановка таймера поиска
  const stopSearchTimer = () => {
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current)
      searchTimerRef.current = null
    }
  }

  // Поиск совпадений
  const findMatch = async (): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) return false;

    if (hasNewChat(user.id)) {
      const notification = getNewChatNotification(user.id);
      if (notification && !notification.isRead) {
        setFoundChatId(notification.chatId);
        return true;
      }
    }
    return false;
  };

  // Запуск сервиса подбора собеседников для эффективного поиска
  const startMatchmaking = () => {
    if (!matchmakingServiceId) {
      console.log('Запускаем сервис подбора собеседников');
      const serviceId = startMatchmakingService(3000); // Проверяем каждые 3 секунды
      setMatchmakingServiceId(serviceId);

      // Запускаем немедленный поиск совпадения
      findMatch().then(result => {
        if (result) {
          console.log('Найдено совпадение сразу!');
        }
      });
    }
  };

  // Поиск собеседника (улучшенная версия)
  const handleStartSearch = () => {
    const user = getCurrentUser();
    if (!user) {
      console.error('Пользователь не авторизован');
      return;
    }

    console.log(`Начинаем поиск собеседника... Режим: ${searchMode}`);

    // Запускаем поиск с выбранными параметрами
    const success = startSearching(
      searchMode === 'random', // true если режим случайного поиска
      selectedInterests,
      [0, 100] // Возрастной диапазон (можно настроить более точно)
    );

    if (success) {
      console.log(`Поиск запущен успешно для пользователя ${user.id}`);
      setIsSearching(true);
      startSearchTimer();
      startMatchmaking(); // Запускаем сервис подбора

      // Анимируем кнопку Telegram (в реальном приложении)
      if (WebApp.MainButton) {
        WebApp.MainButton.setText('Поиск собеседника...');
        WebApp.MainButton.show();
        WebApp.MainButton.disable();
      }

      // Запускаем проверку на наличие новых чатов
      const checkNewChatsInterval = setInterval(() => {
        if (hasNewChat(user.id)) {
          console.log('Найден новый чат во время поиска!');
          const notification = getNewChatNotification(user.id);
          if (notification && !notification.isRead) {
            setFoundChatId(notification.chatId);
            // Останавливаем поиск
            stopSearchTimer();
            setIsSearching(false);
            clearInterval(checkNewChatsInterval);
          }
        }
      }, 2000);

      // Сохраняем интервал для очистки при размонтировании
      (window as any)._newChatCheckInterval = checkNewChatsInterval;
    } else {
      console.error('Не удалось запустить поиск');
    }
  };

  // Отмена поиска
  const handleCancelSearch = () => {
    stopSearching()
    setIsSearching(false)
    stopSearchTimer()

    // Скрываем кнопку Telegram (в реальном приложении)
    if (WebApp.MainButton) {
      WebApp.MainButton.hide()
    }
  }

  // Переключение режима поиска
  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'random' ? 'interests' : 'random')
  }

  // Форматирование времени поиска
  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const goToChat = (chatId: string) => {
    markChatNotificationAsRead(getCurrentUser()?.id || '');
    navigate(`/chat/${chatId}`);
  };

  // Запускаем демо-режим
  const startDemoMode = () => {
    const demoUser = createDemoUserForMatching();
    if (demoUser) {
      setIsDemoMode(true);

      // Запускаем поиск для текущего пользователя
      handleStartSearch();

      // Уведомляем пользователя
      alert(`Демо-режим активирован! Создан собеседник "${demoUser.name}" для поиска пары. Теперь совпадение должно произойти автоматически через несколько секунд.`);

      // Запускаем поиск пары через 2 секунды (чтобы дать UI время обновиться)
      setTimeout(() => {
        triggerMatchmaking()
          .then(result => {
            if (!result) {
              console.error('Не удалось найти пару в демо-режиме');
            }
          });
      }, 2000);
    } else {
      alert('Не удалось запустить демо-режим');
    }
  };

  // Удаляем блоки, связанные с демо-режимом и рекомендациями
  const renderSearchBlock = () => {
    if (foundChatId) {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span className="text-green-500 text-3xl">✓</span>
            </div>
          </motion.div>

          <h2 className="text-xl font-bold mb-2">Собеседник найден!</h2>

          <div className="text-center mb-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Мы нашли вам собеседника. Нажмите кнопку ниже, чтобы начать общение.
            </p>
          </div>

          <Button
            onClick={() => goToChat(foundChatId)}
            variant="primary"
            size="large"
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Начать общение
          </Button>
        </div>
      );
    }

    return isSearching ? (
      <div className="flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mb-4"
        >
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-blue-500 text-3xl">🔍</span>
          </div>
        </motion.div>

        <h2 className="text-xl font-bold mb-2">Поиск собеседника</h2>

        <div className="text-center mb-4">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {searchMode === 'random'
              ? 'Ищем случайного собеседника онлайн...'
              : 'Ищем собеседника с похожими интересами...'}
          </p>
          <div className="font-mono text-lg">{formatSearchTime(searchDuration)}</div>
        </div>

        <Button
          onClick={handleCancelSearch}
          variant="outline"
          size="medium"
          className="border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Отменить поиск
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {currentUser ? `Привет, ${currentUser.name}!` : 'Добро пожаловать!'}
          </h2>
          <Button
            variant="outline"
            onClick={handleGoToSettings}
            className="text-sm px-3 py-1"
          >
            <span className="mr-1">⚙️</span> Настройки
          </Button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 flex w-full max-w-xs">
            <button
              onClick={() => setSearchMode('random')}
              className={`flex-1 px-4 py-2 rounded-full transition-all text-center ${searchMode === 'random'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 dark:text-gray-300'
                }`}
            >
              Случайный
            </button>
            <button
              onClick={() => setSearchMode('interests')}
              className={`flex-1 px-4 py-2 rounded-full transition-all text-center ${searchMode === 'interests'
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 dark:text-gray-300'
                }`}
            >
              По интересам
            </button>
          </div>
        </div>

        {searchMode === 'interests' && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Выберите интересы:</h3>
            <InterestsSelector
              selectedInterests={selectedInterests}
              onChange={handleInterestsChange}
              maxSelections={5}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Выберите до 5 интересов для лучшего подбора собеседника
            </p>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm mb-4">
          {searchMode === 'random' ? (
            <p>
              <strong>Случайный поиск:</strong> Мы подберем вам случайного собеседника онлайн без учета интересов.
            </p>
          ) : (
            <p>
              <strong>Поиск по интересам:</strong> Мы подберем собеседника с похожими интересами для более интересного общения.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleStartSearch}
            fullWidth
            size="large"
            variant="primary"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium shadow-lg"
          >
            <span className="mr-2">👤</span> Найти собеседника
          </Button>

          <Button
            onClick={startDemoMode}
            fullWidth
            variant="outline"
            className="border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <span className="mr-2">🤖</span> Демо-режим (симуляция)
          </Button>

          <Button
            onClick={handleGoToProfile}
            fullWidth
            variant="secondary"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-lg"
          >
            <span className="mr-2">👤</span> Перейти в профиль
          </Button>

          <Button
            onClick={handleGoToChats}
            fullWidth
            variant="secondary"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-lg"
          >
            <span className="mr-2">📩</span> Перейти к чатам
          </Button>
        </div>
      </div>
    );
  };

  // Контейнер для всей страницы с анимацией
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pb-20">
      <AnimatePresence mode="wait">
        {showRegistration ? (
          <motion.div
            key="registration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <motion.h1
              className="text-2xl font-bold mb-6 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Добро пожаловать в Анонимный чат
            </motion.h1>
            <UserRegistration onComplete={handleRegistrationComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <motion.h1
              className="text-2xl font-bold mb-4 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Анонимный чат
            </motion.h1>

            <div className="flex flex-col gap-6">
              {/* Блок поиска */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="p-4 rounded-xl bg-white dark:bg-gray-800 border-0 shadow-md">
                  {renderSearchBlock()}
                </Card>
              </motion.div>

              {/* Блок чатов - НОВЫЙ БЛОК */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <Card className="overflow-hidden border-l-4 border-cyan-500 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm dark:bg-gray-800">
                  <div className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-cyan-100 text-cyan-600 rounded-full mr-3 dark:bg-cyan-900 dark:text-cyan-300">
                          💬
                        </div>
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">Мои чаты</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Все ваши активные и недавние беседы</p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          onClick={handleGoToChats}
                          fullWidth
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-md"
                          animation="pulse"
                        >
                          <span className="mr-2">📩</span> Перейти к чатам
                        </AnimatedButton>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Блок для новичков */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="overflow-hidden border-l-4 border-green-500 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm dark:bg-gray-800">
                  <div className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-3 dark:bg-green-900 dark:text-green-300">
                          🤔
                        </div>
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">Новичок в чате?</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Узнайте, как начать успешное общение</p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          onClick={handleGoToHelp}
                          fullWidth
                          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md"
                          animation="pulse"
                        >
                          <span className="mr-2">💡</span> Как начать общение
                        </AnimatedButton>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Блок групповых чатов */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="overflow-hidden border-l-4 border-purple-500 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm dark:bg-gray-800">
                  <div className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mr-3 dark:bg-purple-900 dark:text-purple-300">
                          👥
                        </div>
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">Групповые чаты</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Присоединяйтесь к группам по интересам</p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          onClick={handleFindRandomGroup}
                          fullWidth
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md"
                          animation="bounce"
                        >
                          <span className="mr-2">🔍</span> Найти анонимную группу
                        </AnimatedButton>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Блок магазина */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="overflow-hidden border-l-4 border-yellow-500 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm dark:bg-gray-800">
                  <div className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full mr-3 dark:bg-yellow-900 dark:text-yellow-300">
                            🛒
                          </div>
                          <div>
                            <h3 className="font-bold text-lg dark:text-white">Магазин</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Улучшите свой опыт общения</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Баланс</p>
                          <p className="font-bold dark:text-white">
                            {userBalance} <span className="text-yellow-500">⭐</span>
                          </p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          onClick={() => navigate('/direct/store')}
                          fullWidth
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white shadow-md"
                          animation="scale"
                        >
                          <span className="mr-2">🛒</span> Перейти в магазин
                        </AnimatedButton>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Блок с ботом-помощником */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Card className="overflow-hidden border-l-4 border-blue-500 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm dark:bg-gray-800">
                  <div className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-3 dark:bg-blue-900 dark:text-blue-300">
                          🤖
                        </div>
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">Бот-помощник</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Получите помощь и ответы на вопросы</p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatedButton
                          onClick={handleGoToBot}
                          fullWidth
                          className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white shadow-md"
                          animation="pulse"
                        >
                          <span className="mr-2">💬</span> Написать боту
                        </AnimatedButton>
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Админ-панель (только для администраторов) */}
              {isAdminUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Card className="overflow-hidden border-l-4 border-red-500 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm dark:bg-gray-800">
                    <div className="p-5">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full mr-3 dark:bg-red-900 dark:text-red-300">
                            ⚙️
                          </div>
                          <div>
                            <h3 className="font-bold text-lg dark:text-white">Панель администратора</h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Управление базой данных и пользователями</p>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <AnimatedButton
                            onClick={handleGoToAdmin}
                            fullWidth
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-md"
                            animation="pulse"
                          >
                            <span className="mr-2">⚙️</span> Панель администратора
                          </AnimatedButton>
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
