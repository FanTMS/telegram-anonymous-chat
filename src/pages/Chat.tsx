import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { getCurrentUser, getUserById } from '../utils/user'
import { getChatById, sendMessage, endChat, Message, addSystemMessage } from '../utils/chat'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageItem } from '../components/MessageItem'
import { markChatNotificationAsRead } from '../utils/matchmaking'
import { sendFriendRequest } from '../utils/friends'
import { sendGameRequest, acceptGameRequest, rejectGameRequest, getGameRequestForChat, makeGameChoice, getActiveGameForChat, GameChoice } from '../utils/games'
import { useNotifications } from '../utils/notifications'

export const Chat = () => {
  const { id: chatId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useNotifications()
  const [currentMessage, setCurrentMessage] = useState('')
  const [chat, setChat] = useState<any>(null)
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

  // Функция для загрузки данных чата
  const loadChatData = async () => {
    setIsLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }

      // Если ID чата передан через параметры - используем его, иначе берем из уведомления
      const targetChatId = chatId || localStorage.getItem('active_chat_id');

      if (!targetChatId) {
        throw new Error('ID чата не найден');
      }

      console.log(`Загрузка данных чата ${targetChatId}...`);

      // Получаем данные чата
      const chatData = getChatById(targetChatId);

      if (!chatData) {
        throw new Error(`Чат с ID ${targetChatId} не найден`);
      }

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

      // Определяем, является ли запрос входящим или исходящим
      if (gameRequest && gameRequest.status === 'pending') {
        if (gameRequest.toUserId === currentUser.id) {
          setHasIncomingGameRequest(true);
        } else if (gameRequest.fromUserId === currentUser.id) {
          setHasOutgoingGameRequest(true);
        }
      }

      // Если есть активная игра, показываем интерфейс игры
      if (game && !game.isCompleted) {
        setActiveGame(game);
        setShowGameInterface(true);

        // Проверяем, сделал ли уже пользователь выбор
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

      console.log(`Чат ${targetChatId} успешно загружен`);
    } catch (error: any) {
      console.error('Ошибка при загрузке чата:', error);
      setError(error.message || 'Произошла ошибка при загрузке чата');
    } finally {
      setIsLoading(false);
    }
  }

  // Загружаем данные чата при загрузке компонента
  useEffect(() => {
    loadChatData()

    // Запускаем периодическое обновление чата
    const intervalId = setInterval(() => {
      if (chatId) {
        const updatedChat = getChatById(chatId)
        if (updatedChat) {
          setChat(updatedChat)
          setMessages(updatedChat.messages || [])

          // Проверяем статус игры
          const gameRequest = getGameRequestForChat(chatId);
          const game = getActiveGameForChat(chatId);

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
    }, 3000)

    return () => clearInterval(intervalId)
  }, [chatId])

  // Прокручиваем к последнему сообщению при обновлении списка
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Отправка сообщения
  const handleSendMessage = () => {
    if (!currentMessage.trim() || !chat) return

    const currentUser = getCurrentUser()
    if (!currentUser) return

    // Отправляем реальное сообщение
    const sentMessage = sendMessage(chat.id, currentUser.id, currentMessage)
    if (sentMessage) {
      // Обновляем список сообщений
      setMessages(prev => [...prev, sentMessage])
    }

    // Очищаем поле ввода
    setCurrentMessage('')
  }

  // Завершение чата
  const handleEndChat = () => {
    if (!chat) {
      navigate('/');
      return;
    }

    try {
      console.log(`Завершаем чат ${chat.id}...`);
      const result = endChat(chat.id);

      if (result) {
        console.log(`Чат ${chat.id} успешно завершен`);
        showSuccess('Чат успешно завершен');

        // Обновляем локальное состояние
        setChat({ ...chat, isActive: false, endedAt: Date.now() });
      } else {
        console.error(`Не удалось завершить чат ${chat.id}`);
        showError('Не удалось завершить чат');
      }
    } catch (error) {
      console.error('Ошибка при завершении чата:', error);
      showError('Произошла ошибка при завершении чата');
    }
  };

  // Добавление собеседника в друзья
  const handleAddFriend = () => {
    if (!partnerId || !chat) return;

    try {
      const result = sendFriendRequest(partnerId, chat.id);

      if (result) {
        showSuccess('Запрос на добавление в друзья отправлен');
        setFriendRequestSent(true);
      } else {
        showError('Не удалось отправить запрос на добавление в друзья');
      }
    } catch (error) {
      console.error('Ошибка при отправке запроса на добавление в друзья:', error);
      showError('Произошла ошибка при отправке запроса на добавление в друзья');
    }
  };

  // Предложение сыграть в игру
  const handleGameRequest = () => {
    if (!partnerId || !chat) return;

    try {
      const result = sendGameRequest(partnerId, chat.id);

      if (result) {
        showSuccess('Приглашение в игру отправлено');
        setHasOutgoingGameRequest(true);
      } else {
        showError('Не удалось отправить приглашение в игру');
      }
    } catch (error) {
      console.error('Ошибка при отправке приглашения в игру:', error);
      showError('Произошла ошибка при отправке приглашения в игру');
    }
  };

  // Принятие запроса на игру
  const handleAcceptGame = () => {
    if (!chat) return;

    const gameRequest = getGameRequestForChat(chat.id);
    if (!gameRequest) return;

    try {
      const result = acceptGameRequest(gameRequest.id);

      if (result) {
        showSuccess('Вы приняли приглашение в игру');
        setHasIncomingGameRequest(false);
        setShowGameInterface(true);

        // Загружаем активную игру
        const game = getActiveGameForChat(chat.id);
        if (game) {
          setActiveGame(game);
        }
      } else {
        showError('Не удалось принять приглашение в игру');
      }
    } catch (error) {
      console.error('Ошибка при принятии приглашения в игру:', error);
      showError('Произошла ошибка при принятии приглашения в игру');
    }
  };

  // Отклонение запроса на игру
  const handleRejectGame = () => {
    if (!chat) return;

    const gameRequest = getGameRequestForChat(chat.id);
    if (!gameRequest) return;

    try {
      const result = rejectGameRequest(gameRequest.id);

      if (result) {
        showInfo('Вы отклонили приглашение в игру');
        setHasIncomingGameRequest(false);
      } else {
        showError('Не удалось отклонить приглашение в игру');
      }
    } catch (error) {
      console.error('Ошибка при отклонении приглашения в игру:', error);
      showError('Произошла ошибка при отклонении приглашения в игру');
    }
  };

  // Выбор в игре (камень, ножницы или бумага)
  const handleGameChoice = (choice: GameChoice) => {
    if (!chat || !activeGame) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      const result = makeGameChoice(chat.id, currentUser.id, choice);

      if (result) {
        setGameChoice(choice);
        showInfo(`Вы выбрали: ${choiceToRussian(choice)}`);
      } else {
        showError('Не удалось сделать выбор в игре');
      }
    } catch (error) {
      console.error('Ошибка при выборе в игре:', error);
      showError('Произошла ошибка при выборе в игре');
    }
  };

  // Перевод выбора на русский
  const choiceToRussian = (choice: GameChoice): string => {
    switch (choice) {
      case 'rock': return 'Камень';
      case 'paper': return 'Бумага';
      case 'scissors': return 'Ножницы';
    }
  };

  // Обработчик нажатия Enter для отправки сообщения
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Рендеринг интерфейса игры
  const renderGameInterface = () => {
    if (!showGameInterface) return null;

    const currentUser = getCurrentUser();
    if (!currentUser || !activeGame) return null;

    // Определяем, сделал ли уже пользователь выбор
    const hasChosen = gameChoice !== null;

    // Определяем, сделал ли выбор оппонент
    const isUserPlayer1 = currentUser.id === activeGame.player1Id;
    const opponentChoice = isUserPlayer1 ? activeGame.player2Choice : activeGame.player1Choice;
    const opponentHasChosen = opponentChoice !== undefined;

    return (
      <Card className="p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Игра "Камень-ножницы-бумага"</h3>
        {hasChosen ? (
          <div className="text-center mb-3">
            <p>Ваш выбор: <strong>{choiceToRussian(gameChoice)}</strong></p>
            {opponentHasChosen ? (
              <p>Ожидаем результаты...</p>
            ) : (
              <p>Ожидаем выбор соперника...</p>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-3">Сделайте ваш выбор:</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => handleGameChoice('rock')}>Камень 🪨</Button>
              <Button onClick={() => handleGameChoice('scissors')}>Ножницы ✂️</Button>
              <Button onClick={() => handleGameChoice('paper')}>Бумага 📄</Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Рендеринг запросов на игру
  const renderGameRequests = () => {
    if (hasIncomingGameRequest) {
      return (
        <Card className="p-4 mb-4 border-l-4 border-blue-500">
          <div className="flex flex-col items-center">
            <p className="mb-3">{partnerName} приглашает вас сыграть в "Камень-ножницы-бумага"</p>
            <div className="flex gap-3">
              <Button onClick={handleAcceptGame} variant="primary">Принять</Button>
              <Button onClick={handleRejectGame} variant="outline">Отклонить</Button>
            </div>
          </div>
        </Card>
      );
    }

    if (hasOutgoingGameRequest) {
      return (
        <Card className="p-4 mb-4 border-l-4 border-yellow-500">
          <p className="text-center">Вы отправили приглашение в игру. Ожидаем ответ...</p>
        </Card>
      );
    }

    return null;
  };

  // Статусный бар чата
  const renderChatStatus = () => {
    const statusClassName = chat?.isActive
      ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
      : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200";

    return (
      <div className={`text-center p-2 mb-4 rounded ${statusClassName}`}>
        {chat?.isActive ? (
          <p>Чат активен</p>
        ) : (
          <p>Чат завершен {chat?.endedAt ? new Date(chat.endedAt).toLocaleString() : ''}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Заголовок чата */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/chats')}
            className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold mr-3">
            {partnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{partnerName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chat?.isActive ? 'В сети' : 'Не в сети'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!friendRequestSent && chat?.isActive && (
            <Button
              variant="outline"
              onClick={handleAddFriend}
              className="text-blue-500 border-blue-300"
              size="small"
            >
              <span className="mr-1">👥</span> В друзья
            </Button>
          )}

          {chat?.isActive && !hasOutgoingGameRequest && !hasIncomingGameRequest && !showGameInterface && (
            <Button
              variant="outline"
              onClick={handleGameRequest}
              className="text-purple-500 border-purple-300"
              size="small"
            >
              <span className="mr-1">🎮</span> Игра
            </Button>
          )}

          {chat?.isActive && (
            <Button
              variant="outline"
              onClick={handleEndChat}
              className="text-red-500 border-red-300"
              size="small"
            >
              Завершить
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card className="flex-1 flex items-center justify-center">
          <div className="animate-spin mr-2">⏳</div>
          <p>Загрузка чата...</p>
        </Card>
      ) : error ? (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Статус чата */}
          {renderChatStatus()}

          {/* Запросы на игру */}
          {renderGameRequests()}

          {/* Интерфейс игры */}
          {renderGameInterface()}

          {/* Область сообщений */}
          <div className="flex-1 overflow-y-auto mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p className="text-center">Начните общение прямо сейчас!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map(message => {
                  const currentUser = getCurrentUser()
                  const isOutgoing = currentUser && message.senderId === currentUser.id

                  // Проверяем, является ли сообщение системным
                  if (message.isSystem) {
                    return (
                      <div key={message.id} className="text-center my-2">
                        <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
                          {message.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <MessageItem
                      key={message.id}
                      text={message.text}
                      timestamp={message.timestamp}
                      isOutgoing={isOutgoing}
                      isRead={message.isRead}
                    />
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Форма отправки сообщений (только для активных чатов) */}
          {chat?.isActive ? (
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите сообщение..."
                  value={currentMessage}
                  onChange={e => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="self-end"
                >
                  Отправить
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400">Чат завершен. Вы не можете отправлять сообщения.</p>
              <Button
                onClick={() => navigate('/chats')}
                variant="secondary"
                className="mt-2"
              >
                Вернуться к списку чатов
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
