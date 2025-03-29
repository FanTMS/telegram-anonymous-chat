import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { getCurrentUser, getUserById } from '../utils/user'
import { getChatById, sendMessage, endChat, Message, addSystemMessage, Chat as ChatType } from '../utils/chat'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageItem } from '../components/MessageItem'
import { markChatNotificationAsRead } from '../utils/matchmaking'
import { sendFriendRequest } from '../utils/friends'
import { sendGameRequest, acceptGameRequest, rejectGameRequest, getGameRequestForChat, makeGameChoice, getActiveGameForChat, GameChoice } from '../utils/games'
import { useNotifications } from '../utils/notifications'
import WebApp from '@twa-dev/sdk'

export const Chat = () => {
  const { id: chatId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useNotifications()
  const [currentMessage, setCurrentMessage] = useState('')
  const [chat, setChat] = useState<ChatType | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [partnerName, setPartnerName] = useState<string>('Собеседник')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showGameInterface, setShowGameInterface] = useState(false)
  const [gameChoice, setGameChoice] = useState<GameChoice | null>(null)
  const [hasIncomingGameRequest, setHasIncomingGameRequest] = useState(false)
  const [hasOutgoingGameRequest, setHasOutgoingGameRequest] = useState(false)
  const [activeGame, setActiveGame] = useState<any>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [gameResult, setGameResult] = useState<any>(null)
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false) // Индикатор печати

  // Функция для загрузки данных чата
  const loadChatData = async () => {
    setIsLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }

      // Если ID чата передан через параметры - используем его, иначе берем из localStorage
      const targetChatId = chatId || localStorage.getItem('active_chat_id');

      if (!targetChatId) {
        throw new Error('ID чата не найден');
      }

      console.log(`[Chat] Загрузка данных чата ${targetChatId}...`);

      // Получаем данные чата
      const chatData = getChatById(targetChatId);

      if (!chatData) {
        throw new Error(`Чат с ID ${targetChatId} не найден`);
      }

      console.log(`[Chat] Чат найден! Участники: ${chatData.participants.join(', ')}`);

      // Проверяем, что текущий пользователь является участником чата
      if (!chatData.participants.includes(currentUser.id)) {
        throw new Error('У вас нет доступа к этому чату');
      }

      // Получаем ID партнера
      const partnerUserId = chatData.participants.find(id => id !== currentUser.id);
      setPartnerId(partnerUserId || null);

      if (partnerUserId) {
        const partner = await getUserById(partnerUserId);
        if (partner) {
          setPartnerName(partner.name || 'Анонимный собеседник');
        }
      }

      // Устанавливаем данные чата и сообщения
      setChat(chatData);
      setMessages(chatData.messages || []);

      // Проверяем, есть ли запрос на игру или активная игра
      const gameRequest = getGameRequestForChat(targetChatId);
      const game = getActiveGameForChat(targetChatId);

      if (game && !game.isCompleted) {
        setActiveGame(game);
        setShowGameInterface(true);

        // Проверяем, выбрал ли уже пользователь свой ход
        if (game.player1Id === currentUser.id && game.player1Choice) {
          setGameChoice(game.player1Choice);
        } else if (game.player2Id === currentUser.id && game.player2Choice) {
          setGameChoice(game.player2Choice);
        }
      } else if (chatData.gameData && chatData.gameData.isCompleted) {
        // Если игра завершена, показываем результат
        setGameResult(chatData.gameData);
      }

      // Проверяем, был ли отправлен запрос в друзья
      setFriendRequestSent(chatData.friendRequestSent || false);

      // Отмечаем уведомление как прочитанное
      markChatNotificationAsRead(currentUser.id);

      console.log(`[Chat] Чат ${targetChatId} успешно загружен`);
    } catch (error: any) {
      console.error('[Chat] Ошибка при загрузке чата:', error);
      setError(error.message || 'Произошла ошибка при загрузке чата');
    } finally {
      setIsLoading(false);
    }
  }

  // Загружаем данные чата при загрузке компонента или изменении ID чата
  useEffect(() => {
    // Пытаемся получить chat ID из локального хранилища, если он не передан через параметры
    if (!chatId) {
      const storedChatId = localStorage.getItem('active_chat_id');
      if (storedChatId) {
        console.log(`[Chat] Получен ID чата из localStorage: ${storedChatId}`);
        // Перенаправляем с URL с корректным ID чата
        navigate(`/chat/${storedChatId}`, { replace: true });
        return;
      }
    }

    loadChatData();

    // Запускаем периодическое обновление чата
    const intervalId = setInterval(() => {
      // Только если ID чата определен
      if (chatId || localStorage.getItem('active_chat_id')) {
        const id = chatId || localStorage.getItem('active_chat_id');
        const updatedChat = getChatById(id);
        if (updatedChat) {
          setChat(updatedChat);
          setMessages(updatedChat.messages || []);

          // Проверяем статус игры если она есть
          const gameRequest = getGameRequestForChat(id);
          const game = getActiveGameForChat(id);

          if (game && !game.isCompleted) {
            setActiveGame(game);
            setShowGameInterface(true);
          }

          // Обновляем статус запросов на игру
          const currentUser = getCurrentUser();
          if (currentUser && gameRequest) {
            if (gameRequest.status === 'pending') {
              setHasIncomingGameRequest(gameRequest.toUserId === currentUser.id);
              setHasOutgoingGameRequest(gameRequest.fromUserId === currentUser.id);
            } else {
              setHasIncomingGameRequest(false);
              setHasOutgoingGameRequest(false);
            }
          }
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [chatId, navigate]); // Добавляем зависимость от navigate

  // Прокручиваем к последнему сообщению при обновлении списка
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Настройка WebApp
  useEffect(() => {
    try {
      if (WebApp && WebApp.isExpanded) {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => navigate(-1));

        // Отключаем MainButton, так как у нас собственная кнопка отправки
        WebApp.MainButton.hide();
      }
    } catch (error) {
      console.error('Ошибка при настройке Telegram WebApp:', error);
    }

    return () => {
      try {
        if (WebApp && WebApp.isExpanded) {
          WebApp.BackButton.offClick(() => navigate(-1));
          WebApp.BackButton.hide();
        }
      } catch (error) {
        console.error('Ошибка при очистке Telegram WebApp:', error);
      }
    };
  }, [navigate]);

  // Отправка сообщения
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !chat) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      // Обеспечиваем тактильную обратную связь
      if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred('light');
      }

      // Отправляем реальное сообщение
      const sentMessage = sendMessage(chat.id, currentUser.id, currentMessage);
      if (sentMessage) {
        // Обновляем список сообщений
        setMessages(prev => [...prev, sentMessage]);

        // Очищаем поле ввода
        setCurrentMessage('');

        // Прокручиваем к новому сообщению
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      showError('Не удалось отправить сообщение');
    }
  };

  // Завершение чата
  const handleEndChat = () => {
    if (!chat || !chat.id) return;

    try {
      // Показываем подтверждение
      WebApp.showConfirm(
        'Вы уверены, что хотите завершить чат?',
        (confirmed) => {
          if (confirmed) {
            const success = endChat(chat.id);
            if (success) {
              showSuccess('Чат завершен');

              // Обеспечиваем тактильную обратную связь
              if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('success');
              }

              navigate('/chats');
            } else {
              showError('Не удалось завершить чат');
            }
          }
        }
      );
    } catch (error) {
      // Если WebApp.showConfirm не поддерживается, используем стандартное подтверждение
      if (window.confirm('Вы уверены, что хотите завершить чат?')) {
        const success = endChat(chat.id);
        if (success) {
          showSuccess('Чат завершен');
          navigate('/chats');
        } else {
          showError('Не удалось завершить чат');
        }
      }
    }
  };

  // Отправка запроса в друзья
  const handleAddFriend = () => {
    if (!partnerId || friendRequestSent || !chat || !chat.id) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      // Обеспечиваем тактильную обратную связь
      if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred('medium');
      }

      // Обновляем состояние чата с флагом friendRequestSent
      const updatedChat = { ...chat, friendRequestSent: true };

      // Добавляем системное сообщение
      const systemMessage = addSystemMessage(chat.id, `${currentUser.name} отправил запрос в друзья.`);

      // Создаем или обновляем запрос в друзья в локальном хранилище
      const friendRequests = JSON.parse(localStorage.getItem('friend_requests') || '[]');
      friendRequests.push({
        id: `fr_${Date.now()}`,
        fromUserId: currentUser.id,
        toUserId: partnerId,
        chatId: chat.id,
        status: 'pending',
        timestamp: Date.now()
      });

      localStorage.setItem('friend_requests', JSON.stringify(friendRequests));

      // Обновляем состояние в localStorage
      const allChats = JSON.parse(localStorage.getItem('chats') || '[]');
      const chatIndex = allChats.findIndex((c: any) => c.id === chat.id);

      if (chatIndex !== -1) {
        allChats[chatIndex].friendRequestSent = true;
        localStorage.setItem('chats', JSON.stringify(allChats));

        // Обновляем состояние в компоненте
        setChat(updatedChat);
        setFriendRequestSent(true);

        // Обновляем список сообщений, если было добавлено системное сообщение
        if (systemMessage) {
          setMessages(prev => [...prev, systemMessage]);
        }

        showSuccess('Запрос в друзья отправлен');
      } else {
        showError('Не удалось найти чат в хранилище');
      }
    } catch (error) {
      console.error('Ошибка при отправке запроса в друзья:', error);
      showError('Произошла ошибка при отправке запроса в друзья');
    }
  };

  // Обработчик выбора эмодзи
  const handleEmojiSelect = (emoji: string) => {
    setCurrentMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Показываем индикатор загрузки
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Показываем сообщение об ошибке
  if (error) {
    return (
      <Card className="p-4 m-2">
        <div className="text-center text-red-500 my-4">{error}</div>
        <Button onClick={() => navigate(-1)} className="w-full">Вернуться назад</Button>
      </Card>
    );
  }

  // Если чат не найден
  if (!chat) {
    return (
      <Card className="p-4 m-2">
        <div className="text-center my-4">Чат не найден</div>
        <Button onClick={() => navigate(-1)} className="w-full">Вернуться назад</Button>
      </Card>
    );
  }

  return (
    <div className="chat-container flex flex-col h-[calc(100vh-80px)]">
      {/* Header чата */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chat-header bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-3 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80"
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="font-medium text-base">{partnerName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {chat.isActive ? 'В сети' : 'Был(а) недавно'}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {!friendRequestSent && (
            <button
              onClick={handleAddFriend}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Добавить в друзья"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleEndChat}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Завершить чат"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Сообщения чата */}
      <motion.div
        className="messages-container flex-1 overflow-y-auto p-3 pb-16 bg-gray-50 dark:bg-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === getCurrentUser()?.id}
              isSystemMessage={message.isSystem}
              showAvatar={
                index === 0 ||
                (messages[index - 1] && messages[index - 1].senderId !== message.senderId)
              }
              animate={true}
            />
          ))}
        </AnimatePresence>

        {/* Индикатор "Печатает..." */}
        {isPartnerTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="typing-indicator text-xs text-gray-500 dark:text-gray-400 ml-12 mb-2"
          >
            {partnerName} печатает...
          </motion.div>
        )}

        {/* Игровой интерфейс */}
        {showGameInterface && activeGame && (
          <div className="game-interface bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md my-4">
            <h3 className="text-center font-medium mb-2">Игра "Камень-ножницы-бумага"</h3>
            <div className="flex justify-center space-x-4 my-3">
              {['rock', 'paper', 'scissors'].map((choice) => (
                <button
                  key={choice}
                  onClick={() => makeGameChoice(activeGame.chatId, getCurrentUser()?.id || '', choice as GameChoice)}
                  disabled={!!gameChoice}
                  className={`game-choice-btn ${gameChoice === choice ? 'active' : ''}`}
                >
                  {choice === 'rock' ? '🪨' : choice === 'paper' ? '📄' : '✂️'}
                </button>
              ))}
            </div>
            {gameChoice && <p className="text-center text-sm text-gray-600 dark:text-gray-400">Ожидаем выбор соперника...</p>}
          </div>
        )}

        {/* Референс для прокрутки к последнему сообщению */}
        <div ref={messagesEndRef}></div>
      </motion.div>

      {/* Интерфейс ввода сообщения */}
      <motion.div
        className="message-input-container sticky bottom-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-3 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {showEmojiPicker && (
          <div className="emoji-picker p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-2">
            <div className="grid grid-cols-8 gap-2">
              {['😊', '😂', '❤️', '👍', '🎉', '🔥', '👋', '😎', '🤔', '😢', '😍', '🙏', '👏', '🌟', '💪', '🤗'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="relative flex-1">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="w-full border dark:border-gray-700 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none leading-tight"
              style={{ maxHeight: '120px', minHeight: '40px' }}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim()}
            className={`p-2 rounded-full ${currentMessage.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
              } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

