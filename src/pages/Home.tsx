import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { isAdmin, getCurrentUser, User } from '../utils/user'
import { getUserCurrency } from '../utils/store'
import { motion, AnimatePresence } from 'framer-motion'
import { UserRegistration } from '../components/UserRegistration'
import { InterestsSelector } from '../components/InterestsSelector'
import { startSearching, stopSearching, isUserSearching, startMatchmakingService, stopMatchmakingService, markChatNotificationAsRead, hasNewChat, getNewChatNotification, triggerMatchmaking, getChatById, getSearchingUsers, shouldContinueSearch } from '../utils/matchmaking'
import { useNotifications } from '../utils/notifications'
import { ActiveSearchCounter } from '../components/ActiveSearchCounter'
import ChatEventManager from '../utils/chat-events'

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
  const { showSuccess, showError } = useNotifications();
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  // Принудительно устанавливаем светлую тему, игнорируя WebApp.colorScheme
  const isDarkTheme = false
  const [isRegistered, setIsRegistered] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<SearchMode>('random')
  const [searchDuration, setSearchDuration] = useState(0)
  const [matchmakingServiceId, setMatchmakingServiceId] = useState<number | null>(null)
  const searchTimerRef = useRef<number | null>(null)
  const [foundChatId, setFoundChatId] = useState<string | null>(null)
  const [hasNewChatNotification, setHasNewChatNotification] = useState(false);
  const [newChatId, setNewChatId] = useState<string | null>(null);
  const checkNewChatIntervalRef = useRef<number | null>(null);

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

  // Добавляем слушатель событий для обнаружения новых чатов
  useEffect(() => {
    const handleChatFound = (event: CustomEvent) => {
      console.log('Получено событие о новом чате:', event.detail.chatId);
      setFoundChatId(event.detail.chatId);

      // Останавливаем поиск, если он был активен
      if (isSearching) {
        stopSearchTimer();
        setIsSearching(false);
        stopSearching();
      }
    };

    // Добавляем обработчик события
    window.addEventListener('chatFound', handleChatFound as EventListener);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('chatFound', handleChatFound as EventListener);
    };
  }, [isSearching]);

  // Обработчик событий для обнаружения новых чатов
  useEffect(() => {
    // Функция проверки наличия новых чатов
    const checkNewChats = () => {
      const user = getCurrentUser();
      if (!user) return;

      console.log('Проверка наличия новых чатов...');
      if (hasNewChat(user.id)) {
        console.log('Найден новый чат!');
        const notification = getNewChatNotification(user.id);
        if (notification) {
          setFoundChatId(notification.chatId);
          // Останавливаем поиск
          if (isSearching) {
            stopSearchTimer();
            setIsSearching(false);
            stopSearching();
          }
        }
      }
    };

    // Проверяем при монтировании компонента
    checkNewChats();

    // Также обрабатываем событие chatFound
    const handleChatFound = (event: CustomEvent) => {
      console.log('Получено событие о новом чате:', event.detail.chatId);
      setFoundChatId(event.detail.chatId);

      // Останавливаем поиск, если он был активен
      if (isSearching) {
        stopSearchTimer();
        setIsSearching(false);
        stopSearching();
      }
    };

    // Добавляем обработчик события
    window.addEventListener('chatFound', handleChatFound as EventListener);

    // Запускаем периодическую проверку
    const checkInterval = setInterval(checkNewChats, 3000);

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('chatFound', handleChatFound as EventListener);
      clearInterval(checkInterval);
    };
  }, [isSearching]);

  // Обработчик событий для обнаружения новых чатов - Улучшенная версия
  useEffect(() => {
    // Функция проверки наличия новых чатов
    const checkNewChats = () => {
      const user = getCurrentUser();
      if (!user) return;

      // console.log('Проверка наличия новых чатов для', user.id);
      if (hasNewChat(user.id)) {
        console.log('🎉 Найден новый чат для пользователя', user.id);
        const notification = getNewChatNotification(user.id);
        if (notification) {
          // Проверка валидности чата
          const chat = getChatById(notification.chatId);
          if (chat && chat.participants.includes(user.id)) {
            console.log('Чат валиден, устанавливаем ID:', notification.chatId);
            setFoundChatId(notification.chatId);

            // Останавливаем поиск если он был активен
            if (isSearching) {
              console.log('Останавливаем активный поиск...');
              stopSearchTimer();
              setIsSearching(false);
              stopSearching(user.id);
            }
          } else {
            console.error('Чат не валиден или пользователь не является участником', notification.chatId);
            // Удаляем невалидное уведомление
            localStorage.removeItem(`new_chat_flag_${user.id}`);
            localStorage.removeItem(`new_chat_notification_${user.id}`);
          }
        }
      }
    };

    // Проверяем при монтировании компонента
    checkNewChats();

    // Также обрабатываем событие chatFound
    const handleChatFound = (event: CustomEvent) => {
      console.log('Получено событие о новом чате:', event.detail);

      // Проверяем, что событие относится к текущему пользователю
      const user = getCurrentUser();
      if (!user) return;

      // Проверка userId указанного в событии (если есть)
      if (event.detail.userId && event.detail.userId !== user.id) {
        console.log('Событие не относится к текущему пользователю');
        return;
      }

      // Обновляем UI, только если чат действительно существует
      const chat = getChatById(event.detail.chatId);
      if (chat && chat.participants.includes(user.id)) {
        console.log('Устанавливаем ID найденного чата:', event.detail.chatId);
        setFoundChatId(event.detail.chatId);

        // Останавливаем поиск, если он был активен
        if (isSearching) {
          console.log('Останавливаем активный поиск из-за события chatFound');
          stopSearchTimer();
          setIsSearching(false);
          stopSearching(user.id);
        }
      } else {
        console.error('Полученный в событии чат не найден или некорректен');
      }
    };

    // Добавляем обработчик события chatFound
    window.addEventListener('chatFound', handleChatFound as EventListener);

    // Запускаем периодическую проверку каждые 2 секунды
    const checkInterval = setInterval(checkNewChats, 2000);

    // Очистка при размонтировании компонента
    return () => {
      window.removeEventListener('chatFound', handleChatFound as EventListener);
      clearInterval(checkInterval);
    };
  }, [isSearching]); // Зависимость от isSearching

  // Добавим эффект для проверки новых чатов
  useEffect(() => {
    // Функция для проверки новых чатов
    const checkForNewChat = () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      try {
        const newChat = hasNewChat(currentUser.id);
        setHasNewChatNotification(newChat);

        if (newChat) {
          const notification = getNewChatNotification(currentUser.id);
          if (notification) {
            setNewChatId(notification.chatId);
            console.log(`[Home] Обнаружен новый чат: ${notification.chatId}`);
          }
        }
      } catch (error) {
        console.error('[Home] Ошибка при проверке новых чатов:', error);
      }
    };

    // Проверяем при монтировании
    checkForNewChat();

    // Настраиваем слушатель события для нового чата
    const handleChatFound = (event: CustomEvent) => {
      const { chatId } = event.detail;
      console.log('[Home] Обнаружен новый чат:', chatId);
      checkForNewChat();
    };

    window.addEventListener('chatFound', handleChatFound as EventListener);

    // Запускаем периодическую проверку
    const intervalId = setInterval(checkForNewChat, 5000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('chatFound', handleChatFound as EventListener);
    };
  }, []);

  // Усиливаем обработчик обнаружения нового чата
  const handleChatFound = (event: CustomEvent) => {
    console.log('[Home] Получено событие о новом чате:', event.detail);

    // Получаем текущего пользователя
    const user = getCurrentUser();
    if (!user) {
      console.error('[Home] Не удалось получить текущего пользователя');
      return;
    }

    const { chatId, participants, timestamp } = event.detail;

    // Проверяем, что событие свежее (не старше 30 секунд)
    if (timestamp && Date.now() - timestamp > 30000) {
      console.log('[Home] Игнорируем устаревшее событие создания чата');
      return;
    }

    // Проверяем, является ли текущий пользователь участником чата
    const isParticipant = Array.isArray(participants) && participants.includes(user.id);
    console.log(`[Home] Пользователь ${user.id} ${isParticipant ? 'является' : 'не является'} участником чата ${chatId}`);

    if (!isParticipant) {
      console.log('[Home] Событие не относится к текущему пользователю');
      return;
    }

    // Проверяем, существует ли чат
    const chat = getChatById(chatId);
    if (!chat) {
      console.error(`[Home] Чат ${chatId} не найден при обработке события`);
      return;
    }

    console.log(`[Home] Найден чат: ${chat.id} с участниками: ${chat.participants.join(', ')}`);

    // Останавливаем поиск, если он был активен
    if (isSearching) {
      console.log('[Home] Останавливаем активный поиск из-за события chatFound');
      stopSearchTimer();
      setIsSearching(false);
      stopSearching(user.id);
    }

    // Установка ID найденного чата в состояние
    setFoundChatId(chatId);

    // Принудительно обновляем уведомления о чате
    const hasNew = hasNewChat(user.id);
    setHasNewChatNotification(hasNew);

    // Если пользователь не находится в режиме поиска собеседника,
    // автоматически переходим в чат
    if (!isSearching) {
      goToChat(chatId);
    }
  };

  // Обработчик периодической проверки новых чатов
  const checkNewChats = useCallback(() => {
    const user = getCurrentUser();
    if (!user || !isSearching) return;

    // Проверяем, нужно ли продолжать поиск
    if (!shouldContinueSearch(user.id)) {
      console.log('Превышено максимальное время ожидания, останавливаем поиск');
      handleCancelSearch();
      showError('К сожалению, подходящий собеседник не найден. Попробуйте изменить параметры поиска.');
      return;
    }

    if (hasNewChat(user.id)) {
      const notification = getNewChatNotification(user.id);
      if (notification && !notification.isRead) {
        setFoundChatId(notification.chatId);
      }
    }
  }, [isSearching, showError]);

  // Обновленный эффект для прослушивания событий новых чатов
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    console.log('[Home] Настройка прослушивателя событий чата для пользователя:', user.id);

    // Проверяем наличие новых чатов при монтировании компонента
    if (hasNewChat(user.id)) {
      const notification = getNewChatNotification(user.id);
      if (notification && !notification.isRead) {
        console.log('[Home] Найден новый чат при загрузке:', notification.chatId);
        setFoundChatId(notification.chatId);
      }
    }

    // Настраиваем слушатель нового события через ChatEventManager
    const removeListener = ChatEventManager.addEventListenerByType('newChatNotification', (event) => {
      console.log('[Home] Получено событие о новом чате через ChatEventManager:', event);

      // Проверяем, что события относится к текущему пользователю
      if (event.meta?.userId === user.id) {
        console.log('[Home] Обнаружен новый чат для текущего пользователя:', event.chatId);

        // Останавливаем поиск, если он был активен
        if (isSearching) {
          console.log('[Home] Останавливаем активный поиск из-за нового чата');
          stopSearchTimer();
          setIsSearching(false);
          stopSearching(user.id);
        }

        // Устанавливаем ID найденного чата
        setFoundChatId(event.chatId);

        // Обновляем состояние уведомлений
        setHasNewChatNotification(true);
        setNewChatId(event.chatId);
      }
    });

    // Слушатель для события создания чата 
    const removeChatCreatedListener = ChatEventManager.addEventListenerByType('chatCreated', (event) => {
      console.log('[Home] Получено событие о создании чата:', event);

      // Проверяем, что пользователь участник в этом чате
      if (event.meta?.participants && Array.isArray(event.meta.participants)) {
        if (event.meta.participants.includes(user.id)) {
          console.log('[Home] Пользователь является участником созданного чата:', event.chatId);

          // Останавливаем поиск, если он был активен
          if (isSearching) {
            console.log('[Home] Останавливаем активный поиск из-за созданного чата');
            stopSearchTimer();
            setIsSearching(false);
            stopSearching(user.id);
          }

          // Устанавливаем ID найденного чата
          setFoundChatId(event.chatId);
        }
      }
    });

    // Очистка при размонтировании
    return () => {
      removeListener();
      removeChatCreatedListener();

      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }

      if (matchmakingServiceId) {
        stopMatchmakingService(matchmakingServiceId);
      }
    };
  }, [isSearching, matchmakingServiceId]);

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

  // Добавим функцию для перехода к странице тестирования чата
  const handleGoToTestChat = () => {
    navigate('/test-chat');
  };

  // Добавим функцию для перехода к странице отладки
  const handleGoToDebug = () => {
    navigate('/debug');
  };

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

  // Поиск собеседника (улучшенная версия с дополнительными логами для отладки)
  const handleStartSearch = () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        console.error('Пользователь не авторизован');
        showError('Необходимо авторизоваться для поиска собеседника');
        return;
      }

      console.log(`[Home] Начинаем поиск собеседника... Режим: ${searchMode}`);
      console.log(`[Home] Текущий пользователь: ${user.id}, Name: ${user.name}`);

      // Очищаем любой старый поиск перед началом нового
      stopSearching(user.id);

      // Очищаем состояние найденного чата
      setFoundChatId(null);
      setNewChatId(null);
      setHasNewChatNotification(false);

      // Запускаем поиск с выбранными параметрами
      const success = startSearching(
        searchMode === 'random', // true если режим случайного поиска
        selectedInterests,
        [0, 100] // Возрастной диапазон (можно настроить более точно)
      );

      if (success) {
        console.log(`[Home] 🚀 Поиск запущен успешно для пользователя ${user.id}`);

        // Проверяем, что пользователь действительно добавлен в список поиска
        const userInList = getSearchingUsers().some(u => u.userId === user.id);
        console.log(`[Home] Пользователь ${user.id} ${userInList ? 'найден' : 'НЕ найден'} в списке поиска:`,
          getSearchingUsers().map(u => u.userId));

        setIsSearching(true);
        startSearchTimer();

        // Запускаем сервис подбора с явным указанием ID пользователя
        console.log(`[Home] Запуск сервиса подбора для пользователя ${user.id}`);
        startMatchmaking();

        // Принудительно запускаем поиск совпадения несколько раз с разными интервалами
        setTimeout(() => {
          triggerMatchmaking().then(result => {
            if (result) {
              console.log('[Home] 🎉 Найдено совпадение после первого запуска!');
            }
          });
        }, 1000);

        setTimeout(() => {
          triggerMatchmaking().then(result => {
            if (result) {
              console.log('[Home] 🎉 Найдено совпадение после второго запуска!');
            }
          });
        }, 3000);

        // Анимируем кнопку Telegram (в реальном приложении)
        if (WebApp.MainButton) {
          WebApp.MainButton.setText('Поиск собеседника...');
          WebApp.MainButton.show();
          WebApp.MainButton.disable();
        }
      } else {
        console.error('[Home] Не удалось запустить поиск');
        showError('Не удалось начать поиск. Пожалуйста, попробуйте еще раз.');
      }
    } catch (error) {
      console.error('[Home] Ошибка при запуске поиска:', error);
      showError('Произошла ошибка при поиске собеседника');
    }
  };

  // Отмена поиска
  const handleCancelSearch = () => {
    const user = getCurrentUser();
    if (user) {
      stopSearching(user.id);
    }
    setIsSearching(false);
    stopSearchTimer();

    // Скрываем кнопку Telegram (в реальном приложении)
    if (WebApp.MainButton) {
      WebApp.MainButton.hide();
    }
  };

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

  // Улучшенная функция перехода в чат с дополнительными проверками
  const goToChat = (chatId: string) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        console.error('Пользователь не авторизован');
        WebApp.showAlert('Необходимо авторизоваться для доступа к чату');
        return;
      }

      console.log(`[Home] Попытка перехода в чат ${chatId} пользователя ${user.id}`);

      // Удаляем префикс "chat_" если он есть в ID
      const normalizedChatId = chatId.startsWith('chat_') ? chatId.substring(5) : chatId;

      // Получаем информацию о чате с учетом возможных форматов ID
      let chat = getChatById(normalizedChatId);

      // Если не нашли, пробуем с префиксом
      if (!chat && !chatId.startsWith('chat_')) {
        chat = getChatById(`chat_${chatId}`);
      }

      if (!chat) {
        console.error(`[Home] Чат с ID ${chatId} не найден`);
        setFoundChatId(null);
        WebApp.showAlert('Чат не найден. Попробуйте найти собеседника снова.');
        return;
      }

      console.log(`[Home] Найден чат: ${chat.id} с участниками: ${chat.participants.join(', ')}`);

      // Проверяем, что текущий пользователь участник чата
      if (Array.isArray(chat.participants) && chat.participants.includes(user.id)) {
        console.log(`[Home] Переходим в чат ${chat.id}`);

        // Отмечаем уведомление как прочитанное перед переходом
        markChatNotificationAsRead(user.id);

        // Сохраняем ID активного чата перед переходом (без префикса "chat_")
        const storageId = chat.id.startsWith('chat_') ? chat.id.substring(5) : chat.id;
        localStorage.setItem('active_chat_id', storageId);

        // Переходим к чату с правильным ID
        navigate(`/chat/${storageId}`);
      } else {
        console.error(`[Home] Пользователь ${user.id} не является участником чата ${chatId}`);
        setFoundChatId(null);
        WebApp.showAlert('Ошибка при подключении к чату. Попробуйте найти собеседника снова.');
      }
    } catch (error) {
      console.error('[Home] Ошибка при переходе в чат:', error);
      WebApp.showAlert('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  };

  // Улучшим обработчик перехода в чат
  const handleGoToChat = () => {
    if (newChatId) {
      console.log('[Home] Переход в чат:', newChatId);
      navigate(`/chat/${newChatId}`);
    } else {
      checkForNewChat();
      const currentUser = getCurrentUser();
      if (currentUser) {
        const notification = getNewChatNotification(currentUser.id);
        if (notification) {
          console.log('[Home] Переход в чат из уведомления:', notification.chatId);
          navigate(`/chat/${notification.chatId}`);
        } else {
          showError('Не удалось найти информацию о чате');
        }
      }
    }
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>

          <h2 className="text-xl font-bold mb-2">Собеседник найден!</h2>

          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Нажмите кнопку, чтобы начать общение
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md"
            >
              Перейти к чату
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
            <svg className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </motion.div>

        <h2 className="text-xl font-bold mb-2">Поиск собеседника</h2>

        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Пожалуйста, подождите, мы ищем для вас подходящего собеседника
          </p>
          <div className="font-mono text-lg tracking-wider bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1 inline-block">
            {formatSearchTime(searchDuration)}
          </div>
        </div>

        {/* Добавляем счетчик активных пользователей во время поиска */}
        <div className="mt-2 mb-4">
          <ActiveSearchCounter refreshIntervalMs={3000} />
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
            Поиск собеседника
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={toggleSearchMode}
              className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-1 px-2 rounded-lg flex items-center gap-1"
            >
              <span>{searchMode === 'random' ? 'Случайный' : 'По интересам'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </motion.div>
        </div>

        <div className="flex justify-center mb-5">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 flex w-full max-w-xs shadow-inner">
            <button
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${searchMode === 'random' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-400'
                }`}
              onClick={() => setSearchMode('random')}
            >
              Случайный
            </button>
            <button
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${searchMode === 'interests' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-600 dark:text-gray-400'
                }`}
              onClick={() => setSearchMode('interests')}
            >
              По интересам
            </button>
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
              <InterestsSelector
                selectedInterests={selectedInterests}
                onChange={handleInterestsChange}
                maxSelections={5}
              />
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
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {searchMode === 'random'
                  ? 'Поиск случайного собеседника без учета интересов для быстрого старта общения.'
                  : 'Поиск собеседника с похожими интересами для более глубокого общения.'}
              </p>

              <Button
                onClick={handleStartSearch}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3"
              >
                {searchMode === 'random' ? 'Найти случайного собеседника' : 'Найти собеседника по интересам'}
              </Button>

              {/* Показываем счетчик активных пользователей */}
              <div className="mt-2">
                <ActiveSearchCounter refreshIntervalMs={3000} />
              </div>
            </div>
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

          {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <ActionCard
              icon="🧪"
              title="Тестирование чатов"
              description="Отладочная страница для тестирования чатов"
              buttonText="🔍 Открыть тест чатов"
              onClick={handleGoToTestChat}
              accentColor="purple"
              animationDelay={0.3}
              buttonAnimation="scale"
            />
          )}

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
              />
              <Card className="p-4 rounded-xl bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-sm border-0 shadow-lg">
                {renderSearchBlock()}
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function checkForNewChat() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    console.log('[checkForNewChat] Пользователь не найден');
    return false;
  }

  try {
    const hasNewChatFlag = hasNewChat(currentUser.id);

    if (hasNewChatFlag) {
      const notification = getNewChatNotification(currentUser.id);
      if (notification) {
        return {
          found: true,
          chatId: notification.chatId,
          otherUserId: notification.otherUserId
        };
      }
    }

    return {
      found: false
    };
  } catch (error) {
    console.error('[checkForNewChat] Ошибка при проверке новых чатов:', error);
    return {
      found: false,
      error: true
    };
  }
}

