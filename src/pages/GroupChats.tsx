import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import {
  getUserGroups,
  getAllGroups,
  Group,
  findAndJoinRandomGroup,
  createGroup
} from '../utils/groups'
import { getCurrentUser } from '../utils/user'
import { AnimatedButton } from '../components/AnimatedButton'
import { motion } from 'framer-motion'

export const GroupChats = () => {
  const navigate = useNavigate()
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [publicGroups, setPublicGroups] = useState<Group[]>([])
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false)
  const [newGroupIsAnonymous, setNewGroupIsAnonymous] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Загрузка списка групп
  const loadGroups = useCallback(() => {
    try {
      // Проверяем авторизацию
      const currentUser = getCurrentUser()
      if (!currentUser) {
        navigate('/')
        return
      }

      // Загружаем группы пользователя
      const userGroups = getUserGroups()
      setMyGroups(userGroups)

      // Загружаем публичные группы
      const allGroups = getAllGroups().filter(group => !group.isPrivate)
      const userGroupIds = userGroups.map(g => g.id)
      const filteredPublicGroups = allGroups.filter(group => !userGroupIds.includes(group.id))
      setPublicGroups(filteredPublicGroups)
    } catch (error) {
      console.error('Ошибка при загрузке групп:', error)
      setMessage('Ошибка при загрузке групп')
      setMessageType('error')
    }
  }, [navigate])

  // Загрузка данных при монтировании
  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // Фильтрация групп по поисковому запросу
  const getFilteredGroups = (groups: Group[]) => {
    if (!searchTerm) return groups

    const term = searchTerm.toLowerCase()
    return groups.filter(group =>
      group.name.toLowerCase().includes(term) ||
      (group.description && group.description.toLowerCase().includes(term)) ||
      group.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }

  // Поиск и присоединение к случайной анонимной группе
  const handleFindRandomGroup = () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Ищем и присоединяемся к случайной группе
      const result = findAndJoinRandomGroup()

      if (result.success && result.group) {
        setMessage(`Вы присоединились к группе "${result.group.name}"`)
        setMessageType('success')

        // Обновляем список групп
        loadGroups()

        // Переходим в чат группы
        setTimeout(() => {
          navigate(`/group/${result.group!.id}`)
        }, 1500)
      } else {
        setMessage('Не удалось найти подходящую группу')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Ошибка при поиске случайной группы:', error)
      setMessage('Ошибка при поиске случайной группы')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Создание новой группы
  const handleCreateGroup = () => {
    setIsLoading(true)
    setMessage(null)

    try {
      if (!newGroupName.trim()) {
        setMessage('Введите название группы')
        setMessageType('error')
        setIsLoading(false)
        return
      }

      // Создаем новую группу
      const group = createGroup(
        newGroupName,
        newGroupDescription,
        newGroupIsAnonymous,
        newGroupIsPrivate
      )

      if (group) {
        setMessage(`Группа "${newGroupName}" успешно создана`)
        setMessageType('success')

        // Сбрасываем форму
        setNewGroupName('')
        setNewGroupDescription('')
        setNewGroupIsPrivate(false)
        setNewGroupIsAnonymous(false)
        setIsCreatingGroup(false)

        // Обновляем список групп
        loadGroups()

        // Переходим в чат новой группы
        setTimeout(() => {
          navigate(`/group/${group.id}`)
        }, 1500)
      } else {
        setMessage('Ошибка при создании группы')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Ошибка при создании группы:', error)
      setMessage('Ошибка при создании группы')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  // Присоединение к группе
  const handleJoinGroup = (group: Group) => {
    navigate(`/group/${group.id}`)
  }

  // Форматирование даты
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Отображение карточки группы
  const renderGroupCard = (group: Group, isMember: boolean) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      key={group.id}
      className="overflow-hidden hover:shadow-lg transition-shadow border-0 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg"
      onClick={() => handleJoinGroup(group)}
    >
      <div className="relative">
        {/* Верхняя полоска с цветом */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${group.isAnonymous
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
            : 'bg-gradient-to-r from-blue-500 to-teal-500'}`}
        ></div>

        <div className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="flex items-start">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-md ${
                    group.isAnonymous
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-br from-blue-500 to-teal-500'
                  } text-white`}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-lg font-bold">{group.name.charAt(0).toUpperCase()}</span>
                </motion.div>
                <div>
                  <h3 className="font-bold text-lg">{group.name}</h3>
                  <div className="flex gap-1 mt-1">
                    {group.isAnonymous && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Анонимный
                      </span>
                    )}
                    {group.isPrivate && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Приватный
                      </span>
                    )}
                    {group.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {group.tags.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                        +{group.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 text-xs">
                {formatDate(group.createdAt)}
              </div>
            </div>

            {group.description && (
              <p className="text-sm text-gray-600 mt-1 border-l-2 border-gray-200 pl-2">{group.description}</p>
            )}

            <div className="flex justify-between items-center mt-2">
              <div className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                <span className="mr-1">👥</span>
                {group.memberCount} / {group.maxMembers}
              </div>
              <AnimatedButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinGroup(group);
                }}
                className={`${isMember
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'}
                  shadow-md text-white`}
                animation="scale"
              >
                {isMember ? (
                  <><span className="mr-1">💬</span> Открыть</>
                ) : (
                  <><span className="mr-1">➕</span> Присоединиться</>
                )}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  // Отображение вкладки "Мои группы"
  const renderMyGroupsTab = () => {
    const filteredGroups = getFilteredGroups(myGroups)

    return (
      <div className="flex flex-col gap-4">
        {filteredGroups.length === 0 ? (
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg">
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">У вас пока нет групп</p>
              <AnimatedButton
                onClick={() => setIsCreatingGroup(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                animation="pulse"
              >
                <span className="mr-1">➕</span> Создать группу
              </AnimatedButton>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredGroups.map(group => renderGroupCard(group, true))}
          </div>
        )}
      </div>
    )
  }

  // Отображение вкладки "Публичные группы"
  const renderPublicGroupsTab = () => {
    const filteredGroups = getFilteredGroups(publicGroups)

    return (
      <div className="flex flex-col gap-4">
        {filteredGroups.length === 0 ? (
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg">
            <div className="text-center py-4">
              <p className="text-gray-500">Публичных групп не найдено</p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredGroups.map(group => renderGroupCard(group, false))}
          </div>
        )}
      </div>
    )
  }

  // Отображение формы создания группы
  const renderCreateGroupForm = () => (
    <Card className="border-0 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm">
      <div className="p-5">
        <h3 className="font-bold text-xl mb-5 text-center">Создание новой группы</h3>

        <div className="flex flex-col gap-4">
          <Input
            label="Название группы"
            placeholder="Введите название группы"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            fullWidth
            required
          />

          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Описание (необязательно)
            </label>
            <textarea
              placeholder="Введите описание группы"
              value={newGroupDescription}
              onChange={e => setNewGroupDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] max-h-[150px] text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Анонимная группа</h4>
                <p className="text-sm text-gray-600">Участники будут отображаться под псевдонимами</p>
              </div>
              <motion.div
                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${newGroupIsAnonymous ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setNewGroupIsAnonymous(!newGroupIsAnonymous)}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newGroupIsAnonymous ? 'left-7' : 'left-1'}`}
                ></div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Приватная группа</h4>
                <p className="text-sm text-gray-600">Не будет отображаться в публичном списке</p>
              </div>
              <motion.div
                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${newGroupIsPrivate ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setNewGroupIsPrivate(!newGroupIsPrivate)}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newGroupIsPrivate ? 'left-7' : 'left-1'}`}
                ></div>
              </motion.div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <AnimatedButton
              onClick={handleCreateGroup}
              isLoading={isLoading}
              fullWidth
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md"
              animation="pulse"
            >
              <span className="mr-1">✓</span> Создать группу
            </AnimatedButton>

            <AnimatedButton
              variant="outline"
              onClick={() => setIsCreatingGroup(false)}
              disabled={isLoading}
              fullWidth
              animation="scale"
            >
              Отмена
            </AnimatedButton>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold mb-2 text-center">Групповые чаты</h1>
      </motion.div>

      {/* Сообщение об ошибке или успехе */}
      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className={`p-3 rounded-lg shadow-md ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        </motion.div>
      )}

      {/* Форма создания группы */}
      {isCreatingGroup ? (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          {renderCreateGroupForm()}
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Кнопки действий */}
          <div className="flex gap-2">
            <AnimatedButton
              onClick={handleFindRandomGroup}
              isLoading={isLoading}
              fullWidth
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md"
              animation="pulse"
            >
              <span className="mr-2">🔍</span> Найти анонимную группу
            </AnimatedButton>

            <AnimatedButton
              onClick={() => setIsCreatingGroup(true)}
              fullWidth
              className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-md"
              animation="scale"
            >
              <span className="mr-2">➕</span> Создать группу
            </AnimatedButton>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Input
              placeholder="Поиск по названию или тегам"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              fullWidth
            />
            {searchTerm && (
              <motion.button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            )}
          </div>

          {/* Вкладки */}
          <div className="flex border-b">
            <motion.button
              className={`px-4 py-2 ${activeTab === 'my'
                ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('my')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              Мои группы
            </motion.button>
            <motion.button
              className={`px-4 py-2 ${activeTab === 'public'
                ? 'border-b-2 border-blue-500 text-blue-500 font-medium'
                : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setActiveTab('public')}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              Публичные группы
            </motion.button>
          </div>

          {/* Содержимое вкладки */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} key={activeTab}>
            {activeTab === 'my' && renderMyGroupsTab()}
            {activeTab === 'public' && renderPublicGroupsTab()}
          </motion.div>
        </div>
      )}
    </div>
  )
}
