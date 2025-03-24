import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from './Card'
import { Button } from './Button'
import { User, getCurrentUser } from '../utils/user'
import { getRecommendedUsers, MatchingStrategy } from '../utils/recommendations'
import { createChat } from '../utils/chat'
import { useNotificationService } from '../utils/notifications'

interface RecommendedUsersProps {
  limit?: number
  showFilter?: boolean
  onSelectUser?: (user: User) => void
}

export const RecommendedUsers: React.FC<RecommendedUsersProps> = ({
  limit = 5,
  showFilter = true,
  onSelectUser
}) => {
  const navigate = useNavigate()
  const notifications = useNotificationService()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<{
    user: User
    score: number
    commonInterests?: string[]
    matchQuality?: number
    conversationLength?: number
    responseTime?: number
    lastChatDate?: number
    goodExperience?: boolean
  }[]>([])
  const [strategy, setStrategy] = useState<MatchingStrategy>('similar')

  // Загрузка рекомендаций
  useEffect(() => {
    const loadRecommendations = () => {
      try {
        const currentUser = getCurrentUser()
        if (!currentUser) return

        // Получаем рекомендации с учетом выбранной стратегии
        let matchingPreference: MatchingStrategy = 'similar'

        // Если у пользователя есть сохраненные настройки, используем их
        if (currentUser.settings?.matchingPreference) {
          matchingPreference = currentUser.settings.matchingPreference as MatchingStrategy
        }

        // Используем выбранную стратегию или текущую предпочтительную
        const userRecommendations = getRecommendedUsers(
          limit,
          strategy || matchingPreference
        )

        setRecommendations(userRecommendations)
      } catch (error) {
        console.error('Ошибка при загрузке рекомендаций:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [limit, strategy])

  // Обработчик смены стратегии
  const handleChangeStrategy = (newStrategy: MatchingStrategy) => {
    setStrategy(newStrategy)
    setLoading(true)
  }

  // Обработчик начала чата с пользователем
  const handleStartChat = (userId: string) => {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) return

      // Создаем новый чат с выбранным пользователем
      const newChat = createChat([currentUser.id, userId])

      if (newChat) {
        // Если передан обработчик выбора пользователя, вызываем его
        if (onSelectUser) {
          const selectedUser = recommendations.find(rec => rec.user.id === userId)?.user
          if (selectedUser) {
            onSelectUser(selectedUser)
          }
        } else {
          // Иначе переходим к созданному чату
          navigate(`/chat/${newChat.id}`)
        }

        // Показываем уведомление
        notifications.showSuccess('Чат создан. Начните общение!')
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error)
      notifications.showError('Не удалось создать чат. Попробуйте снова позже.')
    }
  }

  // Форматирование времени последнего чата
  const formatLastChatTime = (timestamp?: number) => {
    if (!timestamp) return null

    const now = Date.now()
    const diff = now - timestamp

    // Менее часа
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes} мин назад`
    }

    // Менее суток
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours} ч назад`
    }

    // Менее недели
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days} дн назад`
    }

    // Более недели
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  // Форматирование времени ответа
  const formatResponseTime = (milliseconds?: number) => {
    if (!milliseconds) return null

    if (milliseconds < 60 * 1000) {
      return 'Быстрые ответы'
    } else if (milliseconds < 5 * 60 * 1000) {
      return 'Средняя скорость ответа'
    } else {
      return 'Медленные ответы'
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center py-4">
          <p className="text-gray-500">К сожалению, сейчас нет рекомендаций.</p>
          <p className="text-sm text-gray-400 mt-1">
            Попробуйте изменить свои интересы или вернуться позже.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Рекомендуемые собеседники</h3>

      {/* Фильтр стратегии подбора */}
      {showFilter && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              onClick={() => handleChangeStrategy('similar')}
              className={`px-3 py-1 rounded-full ${
                strategy === 'similar'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <span className="mr-1">👥</span> Похожие
            </button>
            <button
              onClick={() => handleChangeStrategy('diverse')}
              className={`px-3 py-1 rounded-full ${
                strategy === 'diverse'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <span className="mr-1">🔄</span> Разнообразные
            </button>
            <button
              onClick={() => handleChangeStrategy('random')}
              className={`px-3 py-1 rounded-full ${
                strategy === 'random'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <span className="mr-1">🎲</span> Случайные
            </button>
          </div>
        </div>
      )}

      {/* Список рекомендованных пользователей */}
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-lg font-bold">
                  {recommendation.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">{recommendation.user.name}</h4>
                  <div className="text-sm text-gray-500">
                    {recommendation.user.age && `${recommendation.user.age} лет • `}
                    {recommendation.user.interests.length > 0 &&
                      `${recommendation.user.interests.length} интересов`}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleStartChat(recommendation.user.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3"
              >
                Начать чат
              </Button>
            </div>

            {/* Метрики соответствия и совместимости */}
            {recommendation.matchQuality !== undefined && (
              <div className="mt-2 mb-1">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2 w-full">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, recommendation.matchQuality)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Совместимость: {Math.round(recommendation.matchQuality || 0)}%</span>
                  {recommendation.goodExperience && (
                    <span className="text-green-500">✓ Хороший опыт общения</span>
                  )}
                </div>
              </div>
            )}

            {/* Информация о предыдущих взаимодействиях */}
            {recommendation.lastChatDate && (
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                  <span className="mr-1">🕒</span>
                  {formatLastChatTime(recommendation.lastChatDate)}
                </span>

                {recommendation.conversationLength && recommendation.conversationLength > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                    <span className="mr-1">💬</span>
                    {recommendation.conversationLength > 20
                      ? 'Долгое общение'
                      : recommendation.conversationLength > 5
                        ? 'Среднее общение'
                        : 'Короткое общение'}
                  </span>
                )}

                {recommendation.responseTime && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                    <span className="mr-1">⚡</span>
                    {formatResponseTime(recommendation.responseTime)}
                  </span>
                )}
              </div>
            )}

            {/* Общие интересы */}
            {recommendation.commonInterests && recommendation.commonInterests.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Общие интересы:</div>
                <div className="flex flex-wrap gap-1">
                  {recommendation.commonInterests.slice(0, 3).map(interest => (
                    <span
                      key={interest}
                      className="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {recommendation.commonInterests.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{recommendation.commonInterests.length - 3} еще
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
