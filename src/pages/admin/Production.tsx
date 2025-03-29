// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\pages\admin\Production.tsx
import { useState } from 'react'
import { AdminGuard } from '../../components/AdminGuard'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { prepareForProduction } from '../../utils/cleanup'
import { resetChatData } from '../../utils/reset'

export const Production = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

    // Функция для подготовки к production режиму
    const handlePrepareForProduction = async () => {
        if (confirm('Вы уверены? Это действие очистит все тестовые данные, но сохранит права администратора.')) {
            setIsLoading(true)
            setMessage(null)

            try {
                const result = await prepareForProduction()

                if (result) {
                    setMessage({
                        text: 'Приложение успешно подготовлено к production использованию.',
                        type: 'success'
                    })
                } else {
                    setMessage({
                        text: 'Произошла ошибка при подготовке приложения к production.',
                        type: 'error'
                    })
                }
            } catch (error) {
                console.error('Ошибка:', error)
                setMessage({
                    text: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                    type: 'error'
                })
            } finally {
                setIsLoading(false)
            }
        }
    }

    // Функция для очистки только данных чатов
    const handleClearChats = async () => {
        if (confirm('Вы уверены? Это действие очистит все чаты и данные поиска.')) {
            setIsLoading(true)
            setMessage(null)

            try {
                const result = await resetChatData()

                if (result) {
                    setMessage({
                        text: 'Все чаты и данные поиска успешно очищены.',
                        type: 'success'
                    })
                } else {
                    setMessage({
                        text: 'Произошла ошибка при очистке чатов.',
                        type: 'error'
                    })
                }
            } catch (error) {
                console.error('Ошибка:', error)
                setMessage({
                    text: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
                    type: 'error'
                })
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <AdminGuard>
            <div className="max-w-3xl mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Управление production режимом</h1>

                {message && (
                    <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid gap-6">
                    <Card className="p-6 border bg-white shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Подготовка к production</h2>
                        <p className="mb-4 text-gray-600">
                            Это действие очистит все тестовые данные и подготовит приложение к использованию
                            в production режиме. Права администраторов будут сохранены.
                        </p>
                        <Button
                            onClick={handlePrepareForProduction}
                            isLoading={isLoading}
                            variant="primary"
                            className="mt-2"
                        >
                            <span className="mr-2">🚀</span> Перейти в production режим
                        </Button>
                    </Card>

                    <Card className="p-6 border bg-white shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Очистка чатов</h2>
                        <p className="mb-4 text-gray-600">
                            Это действие очистит только данные чатов и поиска, но сохранит пользователей и настройки.
                        </p>
                        <Button
                            onClick={handleClearChats}
                            isLoading={isLoading}
                            variant="secondary"
                            className="mt-2"
                        >
                            <span className="mr-2">🗑️</span> Очистить только чаты
                        </Button>
                    </Card>
                </div>
            </div>
        </AdminGuard>
    )
}