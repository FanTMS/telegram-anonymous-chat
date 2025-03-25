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
import { startSearching, stopSearching, isUserSearching, startMatchmakingService, stopMatchmakingService, markChatNotificationAsRead, hasNewChat, getNewChatNotification, triggerMatchmaking } from '../utils/matchmaking'

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

// Вспомогательный компонент для карточки с действием
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  accentColor: string;
  badgeContent?: string | number;
  animationDelay: number;
  buttonAnimation?: 'pulse' | 'scale' | 'bounce';
  rightContent?: React.ReactNode;
  disableGradient?: boolean; // Новое свойство для отключения градиента
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  buttonText,
  onClick,
  accentColor,
  badgeContent,
  animationDelay,
  buttonAnimation = 'pulse',
  rightContent,
  disableGradient = false // Значение по умолчанию
}) => {
  // Формируем класс для кнопки в зависимости от того, нужен ли градиент
  const buttonClassName = disableGradient
    ? `bg-green-600 hover:bg-green-700 text-white font-extrabold shadow-md tracking-wide`
    : `bg-gradient-to-r from-${accentColor}-500 to-${accentColor}-600 hover:from-${accentColor}-600 hover:to-${accentColor}-700 text-white font-extrabold shadow-md tracking-wide`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
    >
      <Card className={`overflow-hidden border-l-4 border-${accentColor}-500 shadow-lg bg-white bg-opacity-95 backdrop-blur-sm dark:bg-gray-800/95`}>
        <div className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 flex items-center justify-center bg-${accentColor}-100 text-${accentColor}-600 rounded-full mr-3 dark:bg-${accentColor}-900 dark:text-${accentColor}-300`}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
                </div>
              </div>
              {rightContent && (
                <div className="text-right">
                  {rightContent}
                </div>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatedButton
                onClick={onClick}
                fullWidth
                className={buttonClassName}
                animation={buttonAnimation}
              >
                <span className="mr-2 drop-shadow-sm text-white">{buttonText.split(' ')[0]}</span>
                <span className="drop-shadow-sm text-white">{buttonText.substr(buttonText.indexOf(' ') + 1)}</span>
              </AnimatedButton>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
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

  // Обновленное отображение поиска
  const renderSearchBlock = () => {
    if (foundChatId) {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shadow-lg">
              <span className="text-green-500 text-3xl">✓</span>
            </div>
          </motion.div>

          <h2 className="text-xl font-bold mb-2">Собеседник найден!</h2>

          <div className="text-center mb-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Мы нашли вам собеседника. Нажмите кнопку ниже, чтобы начать общение.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => goToChat(foundChatId)}
              variant="primary"
              size="large"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg"
            >
              Начать общение
            </Button>
          </motion.div>
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
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shadow-lg">
            <span className="text-blue-500 text-3xl">🔍</span>
          </div>
        </motion.div>

        <h2 className="text-xl font-bold mb-2">Поиск собеседника</h2>

        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {searchMode === 'random'
              ? 'Ищем случайного собеседника онлайн...'
              : 'Ищем собеседника с похожими интересами...'}
          </p>
          <div className="font-mono text-lg tracking-wider bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1 inline-block">{formatSearchTime(searchDuration)}</div>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleCancelSearch}
            variant="outline"
            size="medium"
            className="border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm rounded-lg font-bold"
          >
            Отменить поиск
          </Button>
        </motion.div>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {currentUser ? `Привет, ${currentUser.name}!` : 'Добро пожаловать!'}
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              onClick={handleGoToSettings}
              className="text-sm px-3 py-1 flex items-center shadow-sm rounded-lg font-bold"
            >
              <span className="mr-1">⚙️</span> Настройки
            </Button>
          </motion.div>
        </div>

        <div className="flex justify-center mb-5">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 flex w-full max-w-xs shadow-inner">
            <motion.button
              onClick={() => setSearchMode('random')}
              className={`flex-1 px-4 py-2 rounded-full transition-all text-center font-medium ${searchMode === 'random'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300'
                }`}
              whileHover={searchMode !== 'random' ? { scale: 1.03 } : {}}
              whileTap={{ scale: 0.97 }}
            >
              Случайный
            </motion.button>
            <motion.button
              onClick={() => setSearchMode('interests')}
              className={`flex-1 px-4 py-2 rounded-full transition-all text-center font-medium ${searchMode === 'interests'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300'
                }`}
              whileHover={searchMode !== 'interests' ? { scale: 1.03 } : {}}
              whileTap={{ scale: 0.97 }}
            >
              По интересам
            </motion.button>
          </div>
        </div>

        {searchMode === 'interests' && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-md">
              <h3 className="font-medium mb-3">Выберите интересы:</h3>
              <InterestsSelector
                selectedInterests={selectedInterests}
                onChange={handleInterestsChange}
                maxSelections={5}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                Выберите до 5 интересов для лучшего подбора собеседника
              </p>
            </Card>
          </motion.div>
        )}

        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-opacity-95 backdrop-blur-sm shadow-md bg-white dark:bg-gray-800/95 border-l-4 border-indigo-500">
            <div className="text-sm mb-4">
              {searchMode === 'random' ? (
                <div className="flex items-start">
                  <span className="text-indigo-500 mr-2">ℹ️</span>
                  <p>
                    <strong>Случайный поиск:</strong> Мы подберем вам случайного собеседника онлайн без учета интересов.
                  </p>
                </div>
              ) : (
                <div className="flex items-start">
                  <span className="text-indigo-500 mr-2">ℹ️</span>
                  <p>
                    <strong>Поиск по интересам:</strong> Мы подберем собеседника с похожими интересами для более интересного общения.
                  </p>
                </div>
              )}
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <AnimatedButton
                onClick={handleStartSearch}
                fullWidth
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold shadow-lg"
              >
                <span className="mr-2">👤</span> Найти собеседника
              </AnimatedButton>
            </motion.div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-3">
          <ActionCard
            icon="🤔"
            title="Новичок в чате?"
            description="Узнайте, как начать успешное общение"
            buttonText="💡 Как начать общение"
            onClick={handleGoToHelp}
            accentColor="green"
            animationDelay={0.2}
            buttonAnimation="pulse"
            disableGradient={true}
          />

          <ActionCard
            icon="🤖"
            title="Бот-помощник"
            description="Получите помощь и ответы на вопросы"
            buttonText="💬 Написать боту"
            onClick={handleGoToBot}
            accentColor="blue"
            animationDelay={0.35}
            buttonAnimation="pulse"
          />

          {isAdminUser && (
            <ActionCard
              icon="⚙️"
              title="Панель администратора"
              description="Управление базой данных и пользователями"
              buttonText="⚙️ Панель администратора"
              onClick={handleGoToAdmin}
              accentColor="red"
              animationDelay={0.4}
              buttonAnimation="pulse"
            />
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-2"
          >
            <Button
              onClick={handleGoToProfile}
              fullWidth
              variant="secondary"
              className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-bold shadow-md rounded-lg"
            >
              <span className="mr-2">👤</span> Мой профиль
            </Button>
          </motion.div>
        </div>
      </div>
    );
  };

  // Контейнер для всей страницы с анимацией
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-3 pb-safe">
      <AnimatePresence mode="wait">
        {showRegistration ? (
          <motion.div
            key="registration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
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
            className="w-full max-w-md"
          >
            <motion.h1
              className="text-2xl font-bold mb-5 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Анонимный чат
            </motion.h1>

            <div className="flex flex-col gap-6 mb-10">
              {/* Блок поиска */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="p-4 rounded-xl bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-sm border-0 shadow-lg">
                  {renderSearchBlock()}
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
