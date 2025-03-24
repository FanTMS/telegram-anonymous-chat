import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { Button } from './Button'
import { Card } from './Card'
import { startTelegramAuth, isUserVerified, isTelegramWebApp } from '../utils/telegram-api'
import { getCurrentUser } from '../utils/user'

interface TelegramVerificationProps {
  onVerified?: () => void
  buttonText?: string
  withCard?: boolean
  className?: string
}

export const TelegramVerification = ({
  onVerified,
  buttonText = 'Подтвердить через Telegram',
  withCard = true,
  className = ''
}: TelegramVerificationProps) => {
  const [isVerified, setIsVerified] = useState(false)
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInTelegram, setIsInTelegram] = useState(false)

  useEffect(() => {
    // Проверяем, запущено ли приложение в Telegram WebApp
    setIsInTelegram(isTelegramWebApp())

    // Проверяем, верифицирован ли пользователь
    const verified = isUserVerified()
    setIsVerified(verified)

    // Получаем имя пользователя, если он существует
    const user = getCurrentUser()
    if (user) {
      setUserName(user.name)
    }
  }, [])

  const handleVerification = () => {
    setIsLoading(true)

    try {
      startTelegramAuth()

      // После успешной авторизации
      setTimeout(() => {
        setIsLoading(false)

        // Проверяем, верифицирован ли пользователь
        const verified = isUserVerified()
        setIsVerified(verified)

        // Получаем имя пользователя, если он существует
        const user = getCurrentUser()
        if (user) {
          setUserName(user.name)
        }

        if (verified && onVerified) {
          onVerified()
        }
      }, 1000)
    } catch (error) {
      console.error('Ошибка при авторизации через Telegram:', error)
      setIsLoading(false)

      WebApp.showPopup({
        title: 'Ошибка авторизации',
        message: 'Не удалось выполнить авторизацию через Telegram. Пожалуйста, попробуйте еще раз.',
        buttons: [{ type: 'ok' }]
      })
    }
  }

  const renderContent = () => (
    <div className="flex flex-col gap-4">
      {isVerified ? (
        <div className="flex items-center text-green-600">
          <span className="mr-2">✅</span>
          <p>Аккаунт подтвержден: {userName}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600">
            {isInTelegram
              ? 'Подтвердите свой аккаунт через Telegram для доступа к дополнительным возможностям.'
              : 'Откройте приложение в Telegram для подтверждения аккаунта.'}
          </p>
          <Button
            onClick={handleVerification}
            isLoading={isLoading}
            className={`${isInTelegram ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400'}`}
            disabled={!isInTelegram}
          >
            <span className="mr-2">🔒</span> {buttonText}
          </Button>
        </div>
      )}
    </div>
  )

  if (withCard) {
    return (
      <Card className={`backdrop-blur-sm bg-opacity-90 ${className}`}>
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Подтверждение аккаунта</h3>
          {renderContent()}
        </div>
      </Card>
    )
  }

  return <div className={className}>{renderContent()}</div>
}
