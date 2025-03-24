import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Card } from './Card'
import { Button } from './Button'
import {
  onboardingSteps,
  getUserOnboardingProgress,
  setUserOnboardingProgress
} from '../utils/beginner-tips'

interface OnboardingProps {
  userId: string
  onComplete: () => void
  onSkip?: () => void
}

export const Onboarding = ({ userId, onComplete, onSkip }: OnboardingProps) => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Загружаем текущий прогресс обучения
  useEffect(() => {
    const progress = getUserOnboardingProgress(userId)
    setCurrentStep(progress)
  }, [userId])

  // Функция для перехода к следующему шагу
  const handleNextStep = () => {
    const nextStep = currentStep + 1

    if (nextStep >= onboardingSteps.length) {
      // Обучение завершено
      setUserOnboardingProgress(userId, onboardingSteps.length)
      onComplete()
      return
    }

    setCurrentStep(nextStep)
    setUserOnboardingProgress(userId, nextStep)
  }

  // Функция для пропуска обучения
  const handleSkip = () => {
    setUserOnboardingProgress(userId, onboardingSteps.length)
    setIsVisible(false)
    if (onSkip) {
      onSkip()
    } else {
      onComplete()
    }
  }

  // Если обучение скрыто, не отображаем ничего
  if (!isVisible) {
    return null
  }

  const step = onboardingSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <div className="text-center mb-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{step.title}</h2>
            <div className="text-sm">
              Шаг {currentStep + 1} из {onboardingSteps.length}
            </div>
          </div>

          <div className="flex w-full h-1 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 mb-4">
            <div
              className="flex flex-col justify-center rounded-full overflow-hidden bg-blue-500 text-xs text-white text-center"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>

          <p className={`mb-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            {step.content}
          </p>

          {/* Иллюстрация для текущего шага */}
          <div className="mb-6 flex justify-center">
            {currentStep === 0 && (
              <span className="text-5xl">👋</span>
            )}
            {currentStep === 1 && (
              <span className="text-5xl">🔍</span>
            )}
            {currentStep === 2 && (
              <span className="text-5xl">💬</span>
            )}
            {currentStep === 3 && (
              <span className="text-5xl">🔒</span>
            )}
            {currentStep === 4 && (
              <span className="text-5xl">🎉</span>
            )}
          </div>

          <div className="flex gap-3">
            {currentStep < onboardingSteps.length - 1 && (
              <Button
                variant="outline"
                onClick={handleSkip}
                fullWidth
              >
                Пропустить
              </Button>
            )}

            <Button
              onClick={handleNextStep}
              fullWidth
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {step.buttonText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
