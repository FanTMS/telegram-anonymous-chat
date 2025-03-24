import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { User, saveUser, getCurrentUser } from '../utils/user'

export const TelegramVerifyMock = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [telegramId, setTelegramId] = useState('5394381166') // По умолчанию используем ID из запроса
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!name) {
        setError('Введите имя')
        setIsLoading(false)
        return
      }

      if (!telegramId) {
        setError('Введите Telegram ID')
        setIsLoading(false)
        return
      }

      // Получаем текущего пользователя, если он есть
      let user = getCurrentUser()

      // Если пользователь не существует, создаем нового
      if (!user) {
        const userId = `user_${Date.now()}`
        user = {
          id: userId,
          name,
          age: 25,
          isAnonymous: false,
          interests: [],
          rating: 0,
          createdAt: Date.now(),
          lastActive: Date.now()
        }
      }

      // Обновляем данные пользователя
      user.verified = true
      user.telegramData = {
        telegramId,
        username: username || undefined,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
        photoUrl: undefined,
        authDate: Math.floor(Date.now() / 1000)
      }

      if (!user.name) {
        user.name = name
      }

      // Сохраняем пользователя
      saveUser(user)

      // Показываем уведомление
      setIsLoading(false)
      alert(`Вы успешно авторизованы как ${name}!`)

      // Перенаправляем на главную страницу
      navigate('/')
    } catch (error) {
      console.error('Ошибка при имитации авторизации через Telegram:', error)
      setIsLoading(false)
      setError('Не удалось выполнить авторизацию. Пожалуйста, попробуйте еще раз.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">Имитация авторизации через Telegram</h1>

      {error && (
        <div className="p-3 rounded-md bg-red-100 text-red-800">
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Имя и фамилия"
            placeholder="Введите имя и фамилию"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />

          <Input
            label="Имя пользователя (необязательно)"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />

          <Input
            label="Telegram ID"
            placeholder="Введите Telegram ID"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            fullWidth
            required
          />

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            className="bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">🔒</span> Подтвердить
          </Button>
        </form>
      </Card>

      <Button
        variant="outline"
        onClick={() => navigate('/')}
        fullWidth
      >
        <span className="mr-2">🏠</span> На главную
      </Button>
    </div>
  )
}
