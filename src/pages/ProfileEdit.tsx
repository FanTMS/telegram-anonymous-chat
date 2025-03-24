import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { InterestSelector } from '../components/InterestSelector'
import { useNotificationService } from '../utils/notifications'
import { getCurrentUser, saveUser } from '../utils/user'
import WebApp from '@twa-dev/sdk'

export const ProfileEdit = () => {
    const navigate = useNavigate()
    const notifications = useNotificationService()
    const [name, setName] = useState('')
    const [age, setAge] = useState('')
    const [city, setCity] = useState('')
    const [bio, setBio] = useState('')
    const [interests, setInterests] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Загрузка данных пользователя
    useEffect(() => {
        const user = getCurrentUser()
        if (!user) {
            navigate('/')
            return
        }

        setName(user.name || '')
        setAge(user.age ? user.age.toString() : '')
        setCity(user.city || '')
        setBio(user.bio || '')
        setInterests(user.interests || [])

        // Настройка MainButton для Telegram Mini App
        if (WebApp.isExpanded) {
            WebApp.MainButton.setText('Сохранить изменения')
            WebApp.MainButton.onClick(handleSave)
            WebApp.MainButton.show()
        }

        return () => {
            if (WebApp.isExpanded) {
                WebApp.MainButton.offClick(handleSave)
                WebApp.MainButton.hide()
            }
        }
    }, [navigate])

    // Сохранение изменений
    const handleSave = async () => {
        setIsLoading(true)
        if (WebApp.isExpanded) {
            WebApp.MainButton.showProgress()
        }

        try {
            const user = getCurrentUser()
            if (!user) {
                throw new Error('Пользователь не найден')
            }

            // Обновляем поля пользователя
            user.name = name
            user.age = parseInt(age)
            user.city = city
            user.bio = bio
            user.interests = interests

            // Сохраняем изменения
            await saveUser(user)

            // Обратная связь
            if (WebApp.isExpanded) {
                WebApp.HapticFeedback.notificationOccurred('success')
                WebApp.MainButton.hideProgress()
            }

            notifications.showSuccess('Профиль успешно обновлен')
            navigate('/profile')
        } catch (error) {
            console.error('Ошибка при сохранении профиля:', error)
            notifications.showError('Не удалось сохранить изменения')

            if (WebApp.isExpanded) {
                WebApp.HapticFeedback.notificationOccurred('error')
                WebApp.MainButton.hideProgress()
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-4 max-w-xl mx-auto bg-tg-theme-bg-color text-tg-theme-text-color">
            <h1 className="text-xl font-bold mb-4">Редактирование профиля</h1>

            <Card className="p-4 bg-tg-theme-secondary-bg-color border-0 shadow-sm mb-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-tg-theme-hint-color">Имя</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ваше имя"
                            fullWidth
                            className="bg-tg-theme-bg-color"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-tg-theme-hint-color">Возраст</label>
                        <Input
                            value={age}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '')
                                setAge(value)
                            }}
                            placeholder="Ваш возраст"
                            type="number"
                            fullWidth
                            className="bg-tg-theme-bg-color"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-tg-theme-hint-color">Город</label>
                        <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ваш город"
                            fullWidth
                            className="bg-tg-theme-bg-color"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-tg-theme-hint-color">О себе</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Расскажите о себе..."
                            className="w-full h-24 px-3 py-2 bg-tg-theme-bg-color text-tg-theme-text-color rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-tg-theme-button-color"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2 text-tg-theme-hint-color">Интересы</label>
                        <InterestSelector
                            selectedInterests={interests}
                            onSelectInterest={setInterests}
                        />
                        <p className="text-xs text-tg-theme-hint-color mt-2">
                            Выберите интересы, чтобы находить близких по духу собеседников
                        </p>
                    </div>
                </div>
            </Card>

            {!WebApp.isExpanded && (
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/profile')}
                        className="border-tg-theme-button-color text-tg-theme-link-color"
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isLoading}
                        className="bg-tg-theme-button-color text-tg-theme-button-text-color"
                    >
                        Сохранить
                    </Button>
                </div>
            )}
        </div>
    )
}
