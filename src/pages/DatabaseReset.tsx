import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import {
  User,
  clearDatabase,
  saveUser
} from '../utils/user'

export const DatabaseReset = () => {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Обработчик очистки базы данных
  const handleClearDatabase = () => {
    setMessage(null)

    try {
      const result = clearDatabase()

      if (result) {
        setMessage('База данных успешно очищена. Теперь создайте администратора.')
        setMessageType('success')
      } else {
        setMessage('Ошибка при очистке базы данных')
        setMessageType('error')
      }
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    }
  }

  // Обработчик создания администратора
  const handleCreateAdmin = () => {
    setMessage(null)

    try {
      // Создаем администратора
      const adminUser: User = {
        id: `user_${Date.now()}`,
        name: 'Администратор',
        age: 25,
        city: 'Административный центр',
        rating: 5.0,
        interests: ['Администрирование', 'Управление'],
        isAnonymous: false,
        createdAt: Date.now(),
        lastActive: Date.now(),
        isAdmin: true,
        telegramData: {
          telegramId: '5394381166' // ID из запроса пользователя
        }
      }

      saveUser(adminUser)
      setMessage('Администратор успешно создан. Перенаправление на панель администратора...')
      setMessageType('success')

      // Перенаправляем на панель администратора через 2 секунды
      setTimeout(() => {
        navigate('/direct/admin')
      }, 2000)
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">
        Управление базой данных
      </h1>

      {message && (
        <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <Card className="backdrop-blur-sm bg-opacity-90 shadow-lg">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Очистка базы данных</h2>
          <p className="text-sm text-gray-600 mb-3">
            Это действие удалит все данные пользователей, чаты, сообщения и настройки.
            После очистки вы можете создать нового администратора.
          </p>
          <Button
            onClick={handleClearDatabase}
            variant="danger"
            fullWidth
            className="bg-red-500 hover:bg-red-600"
          >
            <span className="mr-2">🗑️</span> Очистить базу данных
          </Button>
        </div>
      </Card>

      <Card className="backdrop-blur-sm bg-opacity-90 shadow-lg">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-2">Создание администратора</h2>
          <p className="text-sm text-gray-600 mb-3">
            Создание пользователя с правами администратора и Telegram ID: 5394381166
          </p>
          <Button
            onClick={handleCreateAdmin}
            fullWidth
            className="bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">👑</span> Создать администратора
          </Button>
        </div>
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
