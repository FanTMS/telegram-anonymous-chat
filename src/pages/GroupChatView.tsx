import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Group,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  leaveGroup,
  GroupMember,
  GroupMessage,
  GroupMemberRole
} from '../utils/groups'
import { User, getCurrentUser } from '../utils/user'

// Безопасная обертка для методов WebApp API
const safeWebApp = {
  showPopup: (params: any) => {
    try {
      if (WebApp && typeof WebApp.showPopup === 'function') {
        WebApp.showPopup(params);
      } else {
        console.log('WebApp.showPopup не поддерживается:', params);
        alert(params.message || 'Сообщение WebApp');
      }
    } catch (error) {
      console.error('Ошибка при вызове WebApp.showPopup:', error);
      alert(params.message || 'Сообщение WebApp');
    }
  },
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => {
    try {
      if (WebApp && typeof WebApp.showConfirm === 'function') {
        WebApp.showConfirm(message, callback);
      } else {
        console.log('WebApp.showConfirm не поддерживается:', message);
        const confirmed = window.confirm(message);
        callback(confirmed);
      }
    } catch (error) {
      console.error('Ошибка при вызове WebApp.showConfirm:', error);
      const confirmed = window.confirm(message);
      callback(confirmed);
    }
  },
  getColorScheme: () => {
    try {
      if (WebApp && WebApp.colorScheme) {
        return WebApp.colorScheme;
      }
    } catch (error) {
      console.error('Ошибка при получении WebApp.colorScheme:', error);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

// Компонент для отображения сообщения
interface MessageProps {
  message: GroupMessage
  isCurrentUser: boolean
  isAdmin: boolean
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser, isAdmin }) => {
  const isDarkTheme = safeWebApp.getColorScheme() === 'dark';

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isCurrentUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex-shrink-0 h-8 w-8 rounded-full mr-2 flex items-center justify-center ${isAdmin ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'} text-white`}
        >
          {message.senderName?.substring(0, 1).toUpperCase() || '?'}
        </motion.div>
      )}

      <div
        className={`rounded-2xl px-4 py-2 max-w-[80%] break-words ${isCurrentUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : isDarkTheme
              ? 'bg-gray-700 text-white rounded-tl-none'
              : 'bg-gray-200 text-gray-800 rounded-tl-none'
          }`}
      >
        {!isCurrentUser && message.senderName && (
          <div className={`text-xs font-medium mb-1 ${isCurrentUser ? 'text-blue-200' : isDarkTheme ? 'text-gray-300' : 'text-gray-600'
            }`}>
            {message.senderName} {isAdmin && '👑'}
          </div>
        )}
        <div>{message.text}</div>
        <div className={`text-xs text-right mt-1 ${isCurrentUser ? 'text-blue-200' : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
          }`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isCurrentUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex-shrink-0 h-8 w-8 rounded-full ml-2 flex items-center justify-center ${isAdmin ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'} text-white`}
        >
          {message.senderName?.substring(0, 1).toUpperCase() || '?'}
        </motion.div>
      )}
    </motion.div>
  )
}

// Компонент для списка участников
interface MembersListProps {
  members: GroupMember[]
  group: Group
  onClose: () => void
  isCurrentUserAdmin: boolean
}

const MembersList: React.FC<MembersListProps> = ({ members, group, onClose, isCurrentUserAdmin }) => {
  const isDarkTheme = safeWebApp.getColorScheme() === 'dark';
  const currentUser = getCurrentUser();

  const getMemberRoleName = (role: GroupMemberRole) => {
    switch (role) {
      case GroupMemberRole.ADMIN:
        return 'Администратор';
      case GroupMemberRole.MODERATOR:
        return 'Модератор';
      default:
        return 'Участник';
    }
  };

  const getMemberName = (userId: string) => {
    const user = currentUser?.id === userId ? currentUser : null;
    return user?.name || 'Пользователь';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium">Участники группы ({members.length})</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {members.map((member) => {
            const isCurrentUser = currentUser?.id === member.userId;
            const firstLetter = member.isAnonymous
              ? (member.anonymousName?.[0] || 'A')
              : getMemberName(member.userId)[0];

            return (
              <div
                key={member.userId}
                className={`flex items-center p-3 rounded-xl mb-2 ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
              >
                <div className={`h-10 w-10 rounded-full mr-3 flex items-center justify-center ${member.role === GroupMemberRole.ADMIN
                    ? 'bg-blue-500'
                    : member.role === GroupMemberRole.MODERATOR
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  } text-white`}>
                  {firstLetter.toUpperCase()}
                </div>
                <div>
                  <div className="font-medium flex items-center">
                    {member.isAnonymous
                      ? (member.anonymousName || 'Анонимный пользователь')
                      : getMemberName(member.userId)
                    }
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                        Вы
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getMemberRoleName(member.role)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// Основной компонент страницы группового чата
export const GroupChatView = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isMembersVisible, setIsMembersVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка данных группы
  const loadGroupData = useCallback(() => {
    if (!groupId) return;

    try {
      // Получаем данные о группе
      const groupData = localStorage.getItem(`group_${groupId}`);
      if (!groupData) {
        setError('Группа не найдена');
        setIsLoading(false);
        return;
      }

      const groupObj = JSON.parse(groupData) as Group;
      setGroup(groupObj);

      // Получаем сообщения группы
      const groupMessages = getGroupMessages(groupId);
      setMessages(groupMessages);

      // Получаем участников группы
      const groupMembers = getGroupMembers(groupId);
      setMembers(groupMembers);

      // Проверяем, является ли текущий пользователь участником группы
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const member = groupMembers.find(m => m.userId === user.id);
        setCurrentMember(member || null);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке данных группы:', error);
      setError('Ошибка при загрузке данных группы');
      setIsLoading(false);
    }
  }, [groupId]);

  // Загрузка данных группы и пользователя при монтировании
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/');
      return;
    }

    setCurrentUser(user);
    loadGroupData();

    // Устанавливаем интервал для обновления сообщений
    const interval = setInterval(loadGroupData, 5000);
    return () => clearInterval(interval);
  }, [groupId, navigate, loadGroupData]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Отправка сообщения
  const handleSendMessage = async () => {
    if (!groupId || !messageText.trim() || isSendingMessage) return;

    setIsSendingMessage(true);

    try {
      // Проверяем, является ли пользователь участником группы
      if (!currentMember) {
        // Предлагаем присоединиться к группе
        safeWebApp.showConfirm('Вы не являетесь участником этой группы. Присоединиться?', (confirmed) => {
          if (confirmed) {
            handleJoinGroup();
          }
        });
        setIsSendingMessage(false);
        return;
      }

      // Отправляем сообщение
      const message = sendGroupMessage(
        groupId,
        messageText.trim(),
        currentMember.isAnonymous
      );

      if (message) {
        // Добавляем сообщение в список локально для быстрого отображения
        setMessages(prev => [...prev, message]);
        setMessageText('');
        setIsSendingMessage(false);
      } else {
        safeWebApp.showPopup({
          title: 'Ошибка',
          message: 'Не удалось отправить сообщение',
          buttons: [{ type: 'ok' }]
        });
        setIsSendingMessage(false);
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      safeWebApp.showPopup({
        title: 'Ошибка',
        message: 'Произошла ошибка при отправке сообщения',
        buttons: [{ type: 'ok' }]
      });
      setIsSendingMessage(false);
    }
  };

  // Присоединение к группе
  const handleJoinGroup = () => {
    if (!groupId || !currentUser) return;

    setIsLoading(true);

    try {
      // Генерируем анонимное имя для анонимной группы
      let anonymousName;
      if (group?.isAnonymous) {
        const anonymousNames = [
          'Анонимный кот', 'Таинственный гость', 'Незнакомец', 'Инкогнито',
          'Тайный собеседник', 'Анонимус', 'Скрытный наблюдатель', 'Неизвестный'
        ];
        const randomNameIndex = Math.floor(Math.random() * anonymousNames.length);
        anonymousName = `${anonymousNames[randomNameIndex]} ${Math.floor(Math.random() * 100)}`;
      }

      // Присоединяемся к группе
      const success = joinGroup(groupId, group?.isAnonymous || false, anonymousName);

      if (success) {
        safeWebApp.showPopup({
          title: 'Успех',
          message: 'Вы успешно присоединились к группе',
          buttons: [{ type: 'ok' }]
        });

        // Перезагружаем данные группы
        loadGroupData();
      } else {
        safeWebApp.showPopup({
          title: 'Ошибка',
          message: 'Не удалось присоединиться к группе',
          buttons: [{ type: 'ok' }]
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Ошибка при присоединении к группе:', error);
      safeWebApp.showPopup({
        title: 'Ошибка',
        message: 'Произошла ошибка при присоединении к группе',
        buttons: [{ type: 'ok' }]
      });
      setIsLoading(false);
    }
  };

  // Выход из группы
  const handleLeaveGroup = () => {
    if (!groupId) return;

    safeWebApp.showConfirm('Вы уверены, что хотите покинуть группу?', (confirmed) => {
      if (confirmed) {
        try {
          const success = leaveGroup(groupId);

          if (success) {
            safeWebApp.showPopup({
              title: 'Успех',
              message: 'Вы покинули группу',
              buttons: [
                {
                  type: 'ok',
                  text: 'ОК',
                  onPress: () => {
                    navigate('/groups');
                  }
                }
              ]
            });
          } else {
            safeWebApp.showPopup({
              title: 'Ошибка',
              message: 'Не удалось покинуть группу. Возможно, вы единственный администратор.',
              buttons: [{ type: 'ok' }]
            });
          }
        } catch (error) {
          console.error('Ошибка при выходе из группы:', error);
          safeWebApp.showPopup({
            title: 'Ошибка',
            message: 'Произошла ошибка при выходе из группы',
            buttons: [{ type: 'ok' }]
          });
        }
      }
    });
  };

  // Обработка отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Если идет загрузка
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="spinner mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Загрузка чата...</p>
      </div>
    );
  }

  // Если произошла ошибка
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-red-500 mb-4 text-xl">❌</div>
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => navigate('/groups')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          Вернуться к списку групп
        </button>
      </div>
    );
  }

  // Если группа не найдена
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-red-500 mb-4 text-xl">❓</div>
        <p className="text-gray-700 font-medium dark:text-gray-300">Группа не найдена</p>
        <button
          onClick={() => navigate('/groups')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          Вернуться к списку групп
        </button>
      </div>
    );
  }

  // Проверяем, является ли текущий пользователь администратором
  const isCurrentUserAdmin = currentMember?.role === GroupMemberRole.ADMIN;

  return (
    <div className="tg-container flex flex-col h-[calc(100vh-120px)] pb-16">
      {/* Заголовок группы */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-bold">{group.name}</h1>
          <div className="flex gap-1 mt-1">
            {group.isAnonymous && (
              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full">
                Анонимная
              </span>
            )}
            {group.isPrivate && (
              <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full">
                Приватная
              </span>
            )}
            <button
              onClick={() => setIsMembersVisible(true)}
              className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full flex items-center"
            >
              <span className="mr-1">👥</span> {members.length}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {currentMember ? (
            <button
              onClick={handleLeaveGroup}
              className="px-3 py-1.5 text-sm rounded-lg border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Выйти
            </button>
          ) : (
            <button
              onClick={handleJoinGroup}
              className="px-3 py-1.5 text-sm rounded-lg tg-button"
            >
              Присоединиться
            </button>
          )}
        </div>
      </div>

      {/* Секция сообщений */}
      <div className="flex-1 overflow-y-auto pb-4 px-1 mb-4">
        {messages.length > 0 ? (
          messages.map(message => (
            <Message
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUser?.id}
              isAdmin={members.find(m => m.userId === message.senderId)?.role === GroupMemberRole.ADMIN}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Нет сообщений</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Будьте первым, кто начнет обсуждение!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки сообщения */}
      {currentMember ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sticky bottom-0 mt-auto">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="tg-input flex-1"
            placeholder="Напишите сообщение..."
            disabled={isSendingMessage}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSendingMessage}
            className={`p-3 rounded-xl flex-shrink-0 transition-colors ${!messageText.trim() || isSendingMessage
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                : 'tg-button'
              }`}
          >
            {isSendingMessage ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-xl text-center">
          <p className="text-yellow-800 dark:text-yellow-200">
            Присоединитесь к группе, чтобы отправлять сообщения
          </p>
          <button
            onClick={handleJoinGroup}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Присоединиться к группе
          </button>
        </div>
      )}

      {/* Модальное окно со списком участников */}
      <AnimatePresence>
        {isMembersVisible && (
          <MembersList
            members={members}
            group={group}
            onClose={() => setIsMembersVisible(false)}
            isCurrentUserAdmin={isCurrentUserAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Функция для импорта joinGroup
import { joinGroup } from '../utils/groups';
