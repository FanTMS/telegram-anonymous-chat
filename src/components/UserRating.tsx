import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Card } from './Card'
import { Button } from './Button'

// Интерфейс для пропсов рейтинга
interface UserRatingProps {
  userId: string
  currentRating?: number
  onRateUser: (userId: string, rating: number) => void
}

export const UserRating = ({ userId, currentRating = 0, onRateUser }: UserRatingProps) => {
  const [rating, setRating] = useState<number>(currentRating)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<boolean>(false)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Количество звезд для оценки
  const totalStars = 5

  // Обработчик нажатия на звезду
  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating)
  }

  // Обработчик наведения на звезду
  const handleStarHover = (hoveredRating: number) => {
    setHoveredRating(hoveredRating)
  }

  // Обработчик отправки рейтинга
  const handleSubmitRating = () => {
    onRateUser(userId, rating)
    setSubmitted(true)
  }

  // Если рейтинг уже отправлен, показываем сообщение
  if (submitted) {
    return (
      <Card className="text-center">
        <div className="py-4">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-medium mb-2">Спасибо за оценку!</h3>
          <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
            Ваш отзыв поможет другим пользователям
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Оцените собеседника">
      <div className="py-2 text-center">
        <div className="flex justify-center mb-4">
          {[...Array(totalStars)].map((_, index) => {
            const starNumber = index + 1

            return (
              <button
                key={index}
                onClick={() => handleStarClick(starNumber)}
                onMouseEnter={() => handleStarHover(starNumber)}
                onMouseLeave={() => setHoveredRating(null)}
                className="text-3xl px-1 transition-transform hover:scale-110"
              >
                {starNumber <= (hoveredRating || rating) ? '⭐' : '☆'}
              </button>
            )
          })}
        </div>

        <p className={`mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
          {rating === 1 && 'Очень плохо'}
          {rating === 2 && 'Плохо'}
          {rating === 3 && 'Нормально'}
          {rating === 4 && 'Хорошо'}
          {rating === 5 && 'Отлично'}
          {rating === 0 && 'Выберите оценку'}
        </p>

        <Button
          onClick={handleSubmitRating}
          disabled={rating === 0}
          fullWidth
        >
          Отправить оценку
        </Button>
      </div>
    </Card>
  )
}
