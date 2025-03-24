import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { getRandomTip, ChatTip, TipCategory, beginnerTips, MessageTemplate, getTemplateCategories } from '../utils/beginner-tips';
import { Button } from '../components/Button';

export const BeginnerGuide: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tips' | 'templates' | 'examples'>('tips');
  const [activeTipCategory, setActiveTipCategory] = useState<TipCategory | null>(null);
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string | null>(null);
  const [randomTip, setRandomTip] = useState<ChatTip | null>(null);
  const [templateCategories, setTemplateCategories] = useState<string[]>([]);
  const isDarkTheme = WebApp.colorScheme === 'dark';

  // Инициализация при загрузке компонента
  useEffect(() => {
    // Получаем случайный совет
    const tip = getRandomTip();
    setRandomTip(tip);

    // Получаем категории шаблонов
    const categories = getTemplateCategories();
    setTemplateCategories(categories);

    // Настраиваем кнопку "Назад" в Telegram WebApp
    if (WebApp.isExpanded) {
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => navigate(-1));
      WebApp.MainButton.hide();
    }

    return () => {
      // Очищаем при размонтировании
      if (WebApp.isExpanded) {
        WebApp.BackButton.hide();
        WebApp.BackButton.offClick(() => navigate(-1));
      }
    };
  }, [navigate]);

  // Функция для получения нового случайного совета
  const getNewRandomTip = () => {
    const tip = getRandomTip(activeTipCategory || undefined);
    setRandomTip(tip);

    // Добавляем тактильный отклик в Telegram
    if (WebApp.isExpanded && WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  // Анимационные варианты для контейнеров
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  // Анимационные варианты для элементов
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="p-4 pb-20 max-w-xl mx-auto bg-tg-theme-bg-color text-tg-theme-text-color">
      {/* Заголовок страницы */}
      <div className="mb-6">
        <motion.h1
          className="text-2xl font-bold mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Как начать общение
        </motion.h1>
        <motion.p
          className="text-tg-theme-hint-color"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Советы и рекомендации для успешного общения с новыми людьми
        </motion.p>
      </div>

      {/* Случайный совет вверху страницы */}
      {randomTip && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-tg-theme-button-color/10 rounded-xl p-4 border-l-4 border-tg-theme-button-color shadow-sm">
            <div className="flex items-start">
              <div className="mr-3 text-xl">
                {randomTip.icon}
              </div>
              <div>
                <h3 className="font-bold mb-1">{randomTip.title}</h3>
                <p className="text-sm">{randomTip.description}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={getNewRandomTip}
                className="text-tg-theme-button-color text-sm flex items-center p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Ещё совет
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Навигационные вкладки */}
      <div className="flex space-x-1 border-b border-tg-theme-secondary-bg-color mb-6 overflow-x-auto hide-scrollbar">
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'tips'
              ? 'border-b-2 border-tg-theme-button-color font-medium text-tg-theme-button-color'
              : isDarkTheme ? 'text-tg-theme-hint-color' : 'text-tg-theme-hint-color'
            }`}
          onClick={() => setActiveTab('tips')}
        >
          Советы
        </button>
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'templates'
              ? 'border-b-2 border-tg-theme-button-color font-medium text-tg-theme-button-color'
              : isDarkTheme ? 'text-tg-theme-hint-color' : 'text-tg-theme-hint-color'
            }`}
          onClick={() => setActiveTab('templates')}
        >
          Шаблоны сообщений
        </button>
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'examples'
              ? 'border-b-2 border-tg-theme-button-color font-medium text-tg-theme-button-color'
              : isDarkTheme ? 'text-tg-theme-hint-color' : 'text-tg-theme-hint-color'
            }`}
          onClick={() => setActiveTab('examples')}
        >
          Примеры диалогов
        </button>
      </div>

      {/* Содержимое вкладок */}
      <AnimatePresence mode="wait">
        {/* Вкладка "Советы" */}
        {activeTab === 'tips' && (
          <motion.div
            key="tips"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Фильтр по категориям советов */}
            <div className="flex overflow-x-auto pb-2 space-x-2 mb-4 hide-scrollbar">
              <button
                className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${activeTipCategory === null
                    ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                    : isDarkTheme
                      ? 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                      : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                  }`}
                onClick={() => setActiveTipCategory(null)}
              >
                Все
              </button>

              {Object.keys(beginnerTips).map(category => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${activeTipCategory === category
                      ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                      : isDarkTheme
                        ? 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                        : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                    }`}
                  onClick={() => setActiveTipCategory(category as TipCategory)}
                >
                  {category === TipCategory.STARTING && 'Начало разговора'}
                  {category === TipCategory.MAINTAINING && 'Поддержание беседы'}
                  {category === 'connecting' && 'Установление связи'}
                  {category === 'challenging' && 'Сложные ситуации'}
                </button>
              ))}
            </div>

            {/* Список советов */}
            <div className="space-y-3">
              {Object.entries(beginnerTips)
                .filter(([category]) => !activeTipCategory || category === activeTipCategory)
                .map(([category, tips]) => (
                  <div key={category}>
                    {(!activeTipCategory || Object.keys(beginnerTips).length > 1) && (
                      <motion.h3
                        className="font-bold text-lg mb-2 mt-4"
                        variants={itemVariants}
                      >
                        {category === TipCategory.STARTING && 'Начало разговора'}
                        {category === TipCategory.MAINTAINING && 'Поддержание беседы'}
                        {category === 'connecting' && 'Установление связи'}
                        {category === 'challenging' && 'Сложные ситуации'}
                      </motion.h3>
                    )}

                    {tips.map(tip => (
                      <motion.div
                        key={tip.id}
                        className="bg-tg-theme-secondary-bg-color rounded-lg p-4 mb-3"
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start">
                          <span className="text-xl mr-3">{tip.icon}</span>
                          <div>
                            <h4 className="font-bold mb-1">{tip.title}</h4>
                            <p className="text-sm text-tg-theme-hint-color">{tip.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Вкладка "Шаблоны сообщений" */}
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Фильтр по категориям шаблонов */}
            <div className="flex overflow-x-auto pb-2 space-x-2 mb-4 hide-scrollbar">
              <button
                className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${activeTemplateCategory === null
                    ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                    : isDarkTheme
                      ? 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                      : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                  }`}
                onClick={() => setActiveTemplateCategory(null)}
              >
                Все
              </button>

              {templateCategories.map(category => (
                <button
                  key={category}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${activeTemplateCategory === category
                      ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                      : isDarkTheme
                        ? 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                        : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                    }`}
                  onClick={() => setActiveTemplateCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Секция с шаблонами */}
            <div className="space-y-3">
              {/* Современные шаблоны сообщений, организованные по категориям */}
              {templateCategories
                .filter(category => !activeTemplateCategory || category === activeTemplateCategory)
                .map(category => {
                  // Получаем шаблоны для текущей категории из utils/beginner-tips.ts
                  // Это упрощенная логика, в реальном коде вы бы использовали фактические данные
                  const templatesForCategory: MessageTemplate[] = [
                    { id: '1', category, text: 'Привет! Заметил(а), что у нас есть общие интересы. Как ты относишься к [общий интерес]?' },
                    { id: '2', category, text: 'Здравствуй! Что тебя привело к этому чату? Я здесь, чтобы найти новых собеседников.' },
                    { id: '3', category, text: 'Привет! Какая самая интересная вещь произошла с тобой на этой неделе?' }
                  ];

                  return (
                    <motion.div key={category} className="mb-6" variants={itemVariants}>
                      <h3 className="font-bold text-lg mb-3">{category}</h3>
                      <div className="space-y-3">
                        {templatesForCategory.map(template => (
                          <motion.div
                            key={template.id}
                            className="bg-tg-theme-secondary-bg-color rounded-lg overflow-hidden"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="p-4">
                              <p className="text-sm">{template.text}</p>
                            </div>
                            <div className="bg-tg-theme-bg-color/30 p-2 flex justify-end">
                              <button
                                className="text-xs text-tg-theme-button-color flex items-center"
                                onClick={() => {
                                  // Копируем текст в буфер обмена
                                  navigator.clipboard.writeText(template.text);

                                  // Добавляем тактильный отклик
                                  if (WebApp.isExpanded && WebApp.HapticFeedback) {
                                    WebApp.HapticFeedback.notificationOccurred('success');
                                  }

                                  // В реальном приложении здесь было бы уведомление
                                  alert('Шаблон скопирован в буфер обмена');
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                                Копировать
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Вкладка "Примеры диалогов" */}
        {activeTab === 'examples' && (
          <motion.div
            key="examples"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Примеры успешных диалогов с пояснениями */}
            <div className="space-y-6">
              {/* Примеры диалогов из utils/beginner-tips.ts */}
              {/* Это упрощенная логика, в реальном коде вы бы использовали фактические данные */}
              {[
                {
                  id: 'example-1',
                  title: 'Разговор об увлечениях',
                  messages: [
                    { sender: 'you', text: 'Привет! Какие у тебя увлечения?' },
                    { sender: 'other', text: 'Привет! Я люблю фотографию и путешествия. А ты чем увлекаешься?' },
                    { sender: 'you', text: 'Фотография — это здорово! Я тоже люблю путешествовать и еще занимаюсь музыкой. На каком оборудовании снимаешь?' },
                    { sender: 'other', text: 'В основном на Canon EOS. Уже 3 года как увлекаюсь. А ты давно играешь на музыкальных инструментах?' },
                    { sender: 'you', text: 'Около 5 лет играю на гитаре. А какие места тебе больше всего понравились из путешествий?' }
                  ]
                },
                {
                  id: 'example-2',
                  title: 'Разговор о книгах и фильмах',
                  messages: [
                    { sender: 'you', text: 'Привет! Ты любишь читать книги?' },
                    { sender: 'other', text: 'Привет! Да, я много читаю. В основном фэнтези и исторические романы. А ты?' },
                    { sender: 'you', text: 'В основном научную фантастику и детективы. Недавно прочитал(а) "Убийство в Восточном экспрессе", очень понравилось.' }
                  ]
                }
              ].map(example => (
                <motion.div
                  key={example.id}
                  className="bg-tg-theme-secondary-bg-color rounded-xl overflow-hidden"
                  variants={itemVariants}
                >
                  <div className="p-3 border-b border-tg-theme-bg-color">
                    <h3 className="font-bold">{example.title}</h3>
                  </div>
                  <div className="p-4">
                    {example.messages.map((message, index) => (
                      <motion.div
                        key={index}
                        className={`mb-3 flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.sender === 'you'
                              ? 'bg-tg-theme-button-color text-white rounded-br-none'
                              : 'bg-tg-theme-bg-color rounded-bl-none'
                            }`}
                        >
                          {message.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="bg-tg-theme-bg-color/30 p-3">
                    <p className="text-xs text-tg-theme-hint-color">
                      <span className="font-medium text-tg-theme-button-color">Советы:</span> Обратите внимание, как в этом диалоге собеседники задают открытые вопросы и проявляют
                      интерес к хобби друг друга, что способствует развитию беседы.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопка "Начать общение" внизу */}
      <motion.div
        className="mt-8 fixed bottom-20 left-4 right-4 max-w-xl mx-auto z-10"
        style={{ marginLeft: 'auto', marginRight: 'auto' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={() => navigate('/')}
          fullWidth
          className="bg-gradient-to-r from-tg-theme-button-color to-tg-theme-button-color/80 text-tg-theme-button-text-color py-3.5 rounded-xl shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          Начать общение
        </Button>
      </motion.div>
    </div>
  );
};
