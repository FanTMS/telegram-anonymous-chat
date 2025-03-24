import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Button } from './Button'
import { Card } from './Card'
import { GameChoice, GameResult } from '../utils/chat'

// Интерфейс для пропсов игры
interface RockPaperScissorsProps {
  chatId: string
  player1Id: string
  player2Id: string
  onGameComplete: (result: GameResult) => void
  onCancel: () => void
}

// Типы отображения для игровых элементов
const choiceDisplay: Record<GameChoice, { icon: string; name: string }> = {
  rock: { icon: '🪨', name: 'Камень' },
  paper: { icon: '📄', name: 'Бумага' },
  scissors: { icon: '✂️', name: 'Ножницы' }
}

export const RockPaperScissors = ({
  chatId,
  player1Id,
  player2Id,
  onGameComplete,
  onCancel
}: RockPaperScissorsProps) => {
  const [playerChoice, setPlayerChoice] = useState<GameChoice | null>(null)
  const [opponentChoice, setOpponentChoice] = useState<GameChoice | null>(null)
  const [gameResult, setGameResult] = useState<string | null>(null)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Обработчик выбора игрока
  const handleChoice = (choice: GameChoice) => {
    setPlayerChoice(choice)

    // Имитируем выбор оппонента (в реальном приложении здесь будет сетевое взаимодействие)
    const botChoices: GameChoice[] = ['rock', 'paper', 'scissors']
    const randomChoice = botChoices[Math.floor(Math.random() * botChoices.length)]

    // Небольшая задержка для эффекта
    setTimeout(() => {
      setOpponentChoice(randomChoice)

      // Определяем победителя
      let winner: string | undefined
      if (choice === randomChoice) {
        setGameResult('Ничья!')
        winner = undefined
      } else if (
        (choice === 'rock' && randomChoice === 'scissors') ||
        (choice === 'paper' && randomChoice === 'rock') ||
        (choice === 'scissors' && randomChoice === 'paper')
      ) {
        setGameResult('Вы победили!')
        winner = player1Id
      } else {
        setGameResult('Вы проиграли!')
        winner = player2Id
      }

      // Создаем результат игры
      const result: GameResult = {
        chatId,
        player1Id,
        player2Id,
        player1Choice: choice,
        player2Choice: randomChoice,
        winner,
        timestamp: Date.now()
      }

      // Отправляем результат
      setTimeout(() => {
        onGameComplete(result)
      }, 2000) // Показываем результат 2 секунды перед закрытием
    }, 1000)
  }

  return (
    <Card
      title="Камень, ножницы, бумага"
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center">
        {!playerChoice ? (
          <>
            <p className={`mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Выберите свой ход:
            </p>

            <div className="flex justify-center gap-4 mb-4">
              {(Object.keys(choiceDisplay) as GameChoice[]).map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className={`p-4 rounded-lg flex flex-col items-center transition-transform hover:scale-110 ${
                    isDarkTheme ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-3xl mb-2">{choiceDisplay[choice].icon}</span>
                  <span className="text-sm">{choiceDisplay[choice].name}</span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={onCancel}
            >
              Отменить игру
            </Button>
          </>
        ) : (
          <div className="py-4">
            <div className="flex justify-center items-center gap-8 mb-6">
              <div className="text-center">
                <div
                  className={`p-4 rounded-lg mb-2 ${
                    isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <span className="text-4xl">{choiceDisplay[playerChoice].icon}</span>
                </div>
                <p className="text-sm">Вы</p>
              </div>

              <div className="text-2xl font-bold">vs</div>

              <div className="text-center">
                <div
                  className={`p-4 rounded-lg mb-2 ${
                    isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  {opponentChoice ? (
                    <span className="text-4xl">{choiceDisplay[opponentChoice].icon}</span>
                  ) : (
                    <span className="text-4xl animate-pulse">❓</span>
                  )}
                </div>
                <p className="text-sm">Оппонент</p>
              </div>
            </div>

            {gameResult && (
              <div
                className={`text-xl font-bold mb-4 ${
                  gameResult === 'Вы победили!'
                    ? 'text-green-500'
                    : gameResult === 'Вы проиграли!'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                }`}
              >
                {gameResult}
              </div>
            )}

            {!opponentChoice && (
              <p className="text-sm italic">Ожидание хода оппонента...</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
