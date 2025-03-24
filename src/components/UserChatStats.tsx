import React, { useState, useEffect } from 'react'
import { User, getCurrentUser } from '../utils/user'
import { getChatsByUserId } from '../utils/chat'
import { Card } from './Card'

interface UserChatStatsProps {
  userId?: string  // Если не передан, используется текущий пользователь
  className?: string
}

export const UserChatStats: React.FC<UserChatStatsProps> = ({
  userId,
  className = '',
}) => {
  const [stats, setStats] = useState<{
    totalChats: number
    activeChats: number
    totalMessages: number
    sentMessages: number
    receivedMessages: number
    averageResponseTime: number | null
    averageRating: number | null
    favoriteTopics: { topic: string, count: number }[]
    mostActiveTimes: { hour: number, count: number }[]
  }>({
    totalChats: 0,
    activeChats: 0,
    totalMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
    averageResponseTime: null,
    averageRating: null,
    favoriteTopics: [],
    mostActiveTimes: []
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calculateStats = () => {
      try {
        // Получаем ID пользователя
        const currentUser = getCurrentUser()
        if (!currentUser) return

        const targetUserId = userId || currentUser.id

        // Получаем все чаты пользователя
        const userChats = getChatsByUserId(targetUserId)

        // Вычисляем базовую статистику
        const totalChats = userChats.length
        const activeChats = userChats.filter(chat =>
          chat.messages.length > 0 &&
          Date.now() - chat.messages[chat.messages.length - 1].timestamp < 7 * 24 * 60 * 60 * 1000 // последнее сообщение менее 7 дней назад
        ).length

        // Статистика сообщений
        let totalMessages = 0
        let sentMessages = 0
        let receivedMessages = 0
        const responseTimes: number[] = []
        const ratingsReceived: number[] = []
        const messageTimesByHour: { [hour: number]: number } = {}

        // Временный массив для хранения слов из сообщений
        const allWords: string[] = []

        userChats.forEach(chat => {
          // Подсчет сообщений
          chat.messages.forEach(message => {
            totalMessages++

            // Подсчитываем время сообщения
            const messageDate = new Date(message.timestamp)
            const hour = messageDate.getHours()
            messageTimesByHour[hour] = (messageTimesByHour[hour] || 0) + 1

            if (message.senderId === targetUserId) {
              sentMessages++

              // Анализ слов в сообщениях пользователя
              const words = message.text
                .toLowerCase()
                .replace(/[.,!?;:()[\]{}"']/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3) // Исключаем короткие слова

              allWords.push(...words)
            } else {
              receivedMessages++
            }
          })

          // Вычисление времени ответа
          let lastMessage = null
          for (const msg of chat.messages) {
            if (lastMessage && msg.senderId !== lastMessage.senderId) {
              responseTimes.push(msg.timestamp - lastMessage.timestamp)
            }
            lastMessage = msg
          }

          // Собираем полученные рейтинги
          if (chat.rating) {
            for (const [ratedId, rating] of Object.entries(chat.rating)) {
              if (ratedId === targetUserId) {
                ratingsReceived.push(rating)
              }
            }
          }
        })

        // Анализ наиболее часто используемых слов
        const wordFrequency: { [word: string]: number } = {}
        allWords.forEach(word => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1
        })

        // Получаем топ-5 тем на основе часто используемых слов
        const favoriteTopics = Object.entries(wordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([topic, count]) => ({ topic, count }))

        // Получаем наиболее активные часы
        const mostActiveTimes = Object.entries(messageTimesByHour)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        // Вычисляем средние показатели
        const averageResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : null

        const averageRating = ratingsReceived.length > 0
          ? ratingsReceived.reduce((sum, rating) => sum + rating, 0) / ratingsReceived.length
          : null

        // Обновляем состояние
        setStats({
          totalChats,
          activeChats,
          totalMessages,
          sentMessages,
          receivedMessages,
          averageResponseTime,
          averageRating,
          favoriteTopics,
          mostActiveTimes
        })
      } catch (error) {
        console.error('Ошибка при расчете статистики:', error)
      } finally {
        setLoading(false)
      }
    }

    calculateStats()
  }, [userId])

  // Форматирование времени ответа из миллисекунд в удобный формат
  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'Нет данных'

    if (ms < 60 * 1000) {
      return `${Math.round(ms / 1000)} секунд`
    } else if (ms < 60 * 60 * 1000) {
      return `${Math.round(ms / (60 * 1000))} минут`
    } else {
      return `${Math.round(ms / (60 * 60 * 1000))} часов`
    }
  }

  // Форматирование часа в читаемый вид
  const formatHour = (hour: number) => {
    return `${hour}:00 - ${hour + 1}:00`
  }

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="font-semibold mb-4">Статистика общения</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Основная статистика */}
        <div className="space-y-3">
          <div className="flex justify-between px-2 py-1 border-b">
            <span className="text-gray-600 dark:text-gray-400">Всего чатов</span>
            <span className="font-medium">{stats.totalChats}</span>
          </div>
          <div className="flex justify-between px-2 py-1 border-b">
            <span className="text-gray-600 dark:text-gray-400">Активные чаты</span>
            <span className="font-medium">{stats.activeChats}</span>
          </div>
          <div className="flex justify-between px-2 py-1 border-b">
            <span className="text-gray-600 dark:text-gray-400">Всего сообщений</span>
            <span className="font-medium">{stats.totalMessages}</span>
          </div>
          <div className="flex justify-between px-2 py-1 border-b">
            <span className="text-gray-600 dark:text-gray-400">Отправлено</span>
            <span className="font-medium">{stats.sentMessages}</span>
          </div>
          <div className="flex justify-between px-2 py-1 border-b">
            <span className="text-gray-600 dark:text-gray-400">Получено</span>
            <span className="font-medium">{stats.receivedMessages}</span>
          </div>
        </div>

        {/* Дополнительная статистика */}
        <div className="space-y-3">
          <div className="flex justify-between px-2 py-1 border-b">
            <span className="text-gray-600 dark:text-gray-400">Среднее время ответа</span>
            <span className="font-medium">{formatResponseTime(stats.averageResponseTime)}</span>
          </div>

          {stats.averageRating !== null && (
            <div className="flex justify-between px-2 py-1 border-b">
              <span className="text-gray-600 dark:text-gray-400">Средний рейтинг</span>
              <span className="font-medium">
                {stats.averageRating.toFixed(1)} / 5
                <span className="ml-1 text-yellow-500">
                  {'★'.repeat(Math.round(stats.averageRating))}
                  {'☆'.repeat(5 - Math.round(stats.averageRating))}
                </span>
              </span>
            </div>
          )}

          {/* Наиболее активные часы */}
          {stats.mostActiveTimes.length > 0 && (
            <div>
              <div className="text-gray-600 dark:text-gray-400 px-2 py-1 border-b">
                Активность по времени
              </div>
              <div className="px-2 py-1">
                {stats.mostActiveTimes.map((timeSlot, index) => (
                  <div key={index} className="flex justify-between items-center my-1">
                    <span className="text-sm">{formatHour(timeSlot.hour)}</span>
                    <div className="flex-1 mx-2">
                      <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(timeSlot.count / stats.mostActiveTimes[0].count) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{timeSlot.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Часто обсуждаемые темы */}
      {stats.favoriteTopics.length > 0 && (
        <div className="mt-4">
          <h4 className="text-gray-600 dark:text-gray-400 mb-2">Часто обсуждаемые темы</h4>
          <div className="flex flex-wrap gap-2">
            {stats.favoriteTopics.map((topic, index) => (
              <span
                key={index}
                className="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs px-2 py-1 rounded-full"
              >
                {topic.topic}
                <span className="ml-1 text-gray-500">({topic.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
