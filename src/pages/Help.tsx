import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'

// Интерфейс для FAQs
interface FAQItem {
  question: string
  answer: string
}

export const Help = () => {
  const navigate = useNavigate()
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
  const [reportText, setReportText] = useState('')
  const [isReportSubmitted, setIsReportSubmitted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Часто задаваемые вопросы
  const faqs: FAQItem[] = [
    {
      question: 'Как начать чат?',
      answer: 'На главной странице нажмите кнопку "Найти случайного собеседника". Вы будете автоматически подключены к случайному пользователю для анонимного общения.'
    },
    {
      question: 'Как добавить собеседника в друзья?',
      answer: 'Во время активного чата нажмите на кнопку с иконкой "👥" в верхней части экрана и подтвердите добавление в друзья. Собеседник получит соответствующее уведомление.'
    },
    {
      question: 'Как играть в "Камень-ножницы-бумага"?',
      answer: 'Во время активного чата нажмите на кнопку с иконкой "🎮" в верхней части экрана. Откроется игра, где вы сможете выбрать свой ход (камень, ножницы или бумага). Ваш собеседник также сделает свой выбор, и результат будет показан обоим участникам.'
    },
    {
      question: 'Как оценить собеседника?',
      answer: 'После завершения чата вам будет предложено оценить собеседника по шкале от 1 до 5 звезд. Ваша оценка влияет на общий рейтинг пользователя.'
    },
    {
      question: 'Видно ли мое настоящее имя и другие данные?',
      answer: 'Нет, общение анонимное. При регистрации вы можете указать имя или оставить поле пустым для получения случайного псевдонима. Ваши личные данные не передаются другим пользователям.'
    },
    {
      question: 'Как пожаловаться на пользователя?',
      answer: 'Вы можете отправить жалобу через раздел "Сообщить о проблеме" на этой странице, указав подробную информацию о нарушении.'
    },
    {
      question: 'Могу ли я удалить свой аккаунт?',
      answer: 'Да, в разделе "Профиль" в нижней части экрана есть кнопка "Выйти из аккаунта". После выхода ваши данные будут удалены.'
    }
  ]

  // Обработчик отправки жалобы
  const handleSubmitReport = () => {
    // В реальном приложении здесь будет запрос к API
    // Для демонстрации просто показываем сообщение об успешной отправке
    setIsReportSubmitted(true)

    // Через некоторое время сбрасываем форму
    setTimeout(() => {
      setReportText('')
      setIsReportSubmitted(false)
    }, 3000)
  }

  // Фильтрация вопросов по поисковому запросу
  const filteredFaqs = searchTerm
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : faqs

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">
        Помощь
      </h1>

      {/* Поиск */}
      <Input
        placeholder="Поиск по вопросам..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
      />

      {/* Часто задаваемые вопросы */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">Часто задаваемые вопросы</h2>

        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <Card
              key={index}
              className="cursor-pointer transition-all"
              onClick={() => setActiveQuestion(activeQuestion === faq.question ? null : faq.question)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{faq.question}</h3>
                <span className="text-lg">
                  {activeQuestion === faq.question ? '▼' : '▶'}
                </span>
              </div>

              {activeQuestion === faq.question && (
                <div className={`mt-3 pt-3 border-t ${
                  isDarkTheme ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
                }`}>
                  {faq.answer}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-4">
              <p>Ничего не найдено по вашему запросу.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Отправка жалобы */}
      <div className="mt-4">
        <h2 className="text-xl font-medium mb-3">Сообщить о проблеме</h2>

        <Card>
          {!isReportSubmitted ? (
            <div className="flex flex-col gap-4">
              <p className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'}>
                Если у вас возникла проблема или вы хотите сообщить о нарушении, заполните форму ниже:
              </p>

              <Input
                label="Описание проблемы"
                placeholder="Опишите проблему подробно..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                fullWidth
                as="textarea"
                rows={4}
              />

              <Button
                onClick={handleSubmitReport}
                disabled={!reportText.trim()}
                fullWidth
              >
                Отправить
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-medium mb-2">Спасибо за обращение!</h3>
              <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
                Ваше сообщение принято. Мы рассмотрим вашу проблему в ближайшее время.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Контактная информация */}
      <Card className="mt-4">
        <h3 className="font-medium mb-2">Контактная информация</h3>
        <p className={`mb-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
          Если у вас остались вопросы, вы можете связаться с нами:
        </p>
        <ul className={`list-disc list-inside ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
          <li>Email: support@anonymouschat.app</li>
          <li>Telegram: @AnonymousChatSupport</li>
        </ul>
      </Card>
    </div>
  )
}
