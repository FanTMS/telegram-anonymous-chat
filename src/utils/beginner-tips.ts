// Типы для советов новичкам
export interface ChatTip {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface MessageTemplate {
  id: string;
  category: string;
  text: string;
}

export interface ConversationExample {
  id: string;
  title: string;
  messages: {
    sender: 'you' | 'other';
    text: string;
  }[];
}

// Категории советов
export enum TipCategory {
  STARTING = 'starting',
  MAINTAINING = 'maintaining',
  TOPICS = 'topics',
  ETIQUETTE = 'etiquette',
  SAFETY = 'safety'
}

// Советы для начинающих
export const beginnerTips: Record<TipCategory, ChatTip[]> = {
  [TipCategory.STARTING]: [
    {
      id: 'greeting',
      title: 'Начните с приветствия',
      description: 'Простое "Привет!" или "Здравствуйте!" задает дружелюбный тон разговора.',
      icon: '👋'
    },
    {
      id: 'introduce',
      title: 'Кратко представьтесь',
      description: 'Расскажите немного о себе, но без личных данных. Например, упомяните свои хобби или интересы.',
      icon: '🙋'
    },
    {
      id: 'ask-question',
      title: 'Задайте открытый вопрос',
      description: 'Вопросы, на которые нельзя ответить просто "да" или "нет", располагают к беседе.',
      icon: '❓'
    }
  ],
  [TipCategory.MAINTAINING]: [
    {
      id: 'active-listening',
      title: 'Активное слушание',
      description: 'Показывайте интерес к словам собеседника, задавайте уточняющие вопросы по его сообщениям.',
      icon: '👂'
    },
    {
      id: 'share-thoughts',
      title: 'Делитесь мнением',
      description: 'Высказывайте своё мнение по обсуждаемым темам, но с уважением к позиции собеседника.',
      icon: '💭'
    },
    {
      id: 'be-positive',
      title: 'Сохраняйте позитивный настрой',
      description: 'Даже при обсуждении сложных тем старайтесь не переходить к негативу.',
      icon: '😊'
    }
  ],
  [TipCategory.TOPICS]: [
    {
      id: 'common-interests',
      title: 'Найдите общие интересы',
      description: 'Музыка, фильмы, книги, хобби — отличные темы для начала разговора.',
      icon: '🔍'
    },
    {
      id: 'current-events',
      title: 'Обсудите актуальные события',
      description: 'Новости культуры, технологий или спорта — хорошие нейтральные темы.',
      icon: '📰'
    },
    {
      id: 'avoid-controversial',
      title: 'Избегайте спорных тем',
      description: 'Политика и религия часто вызывают конфликты, особенно в начале общения.',
      icon: '⚠️'
    }
  ],
  [TipCategory.ETIQUETTE]: [
    {
      id: 'respect',
      title: 'Проявляйте уважение',
      description: 'Уважайте мнение и границы собеседника, даже если вы не согласны.',
      icon: '🤝'
    },
    {
      id: 'no-spam',
      title: 'Не спамьте',
      description: 'Не отправляйте много сообщений подряд и не злоупотребляйте стикерами.',
      icon: '🚫'
    },
    {
      id: 'respond-timely',
      title: 'Отвечайте своевременно',
      description: 'Долгие паузы без объяснения могут восприниматься как незаинтересованность.',
      icon: '⏱️'
    }
  ],
  [TipCategory.SAFETY]: [
    {
      id: 'privacy',
      title: 'Берегите личные данные',
      description: 'Не делитесь телефоном, адресом и другой конфиденциальной информацией.',
      icon: '🔒'
    },
    {
      id: 'trust-gradually',
      title: 'Доверяйте постепенно',
      description: 'Даже если общение кажется приятным, не спешите с доверием.',
      icon: '🛡️'
    },
    {
      id: 'report-issues',
      title: 'Сообщайте о нарушениях',
      description: 'Если собеседник нарушает правила, воспользуйтесь функцией жалобы.',
      icon: '🚨'
    }
  ]
};

// Шаблоны сообщений для разных ситуаций
export const messageTemplates: MessageTemplate[] = [
  {
    id: 'intro-1',
    category: 'Знакомство',
    text: 'Привет! Как твой день проходит?'
  },
  {
    id: 'intro-2',
    category: 'Знакомство',
    text: 'Здравствуйте! Интересно узнать, какие у вас хобби?'
  },
  {
    id: 'intro-3',
    category: 'Знакомство',
    text: 'Привет! Я новичок здесь. Чем ты обычно занимаешься в свободное время?'
  },
  {
    id: 'hobby-1',
    category: 'Хобби',
    text: 'Какие книги тебе нравятся? У меня недавно появился интерес к научной фантастике.'
  },
  {
    id: 'hobby-2',
    category: 'Хобби',
    text: 'Смотришь сериалы? Что бы ты мог(ла) порекомендовать?'
  },
  {
    id: 'hobby-3',
    category: 'Хобби',
    text: 'Любишь путешествовать? Какие места тебе запомнились больше всего?'
  },
  {
    id: 'opinion-1',
    category: 'Мнения',
    text: 'Как ты думаешь, искусственный интеллект изменит нашу жизнь к лучшему?'
  },
  {
    id: 'opinion-2',
    category: 'Мнения',
    text: 'Какой фильм, по твоему мнению, стоит посмотреть всем хотя бы раз в жизни?'
  },
  {
    id: 'opinion-3',
    category: 'Мнения',
    text: 'Если бы ты мог(ла) выбрать любую суперспособность, что бы это было и почему?'
  },
  {
    id: 'continue-1',
    category: 'Продолжение беседы',
    text: 'Это очень интересно! Расскажи об этом подробнее.'
  },
  {
    id: 'continue-2',
    category: 'Продолжение беседы',
    text: 'А как ты пришел(ла) к такому увлечению?'
  },
  {
    id: 'continue-3',
    category: 'Продолжение беседы',
    text: 'Согласен(на) с тобой. А что ты думаешь о...?'
  }
];

// Примеры успешных диалогов
export const conversationExamples: ConversationExample[] = [
  {
    id: 'example-1',
    title: 'Знакомство через общие интересы',
    messages: [
      { sender: 'you', text: 'Привет! Как дела? Чем увлекаешься?' },
      { sender: 'other', text: 'Привет! Всё отлично, спасибо. Я люблю фотографию и немного занимаюсь музыкой. А ты?' },
      { sender: 'you', text: 'О, здорово! Я тоже интересуюсь фотографией. Какой жанр тебе больше нравится?' },
      { sender: 'other', text: 'В основном уличная фотография и пейзажи. Люблю ловить интересные моменты из жизни города.' },
      { sender: 'you', text: 'Звучит интересно! У меня тоже есть несколько удачных городских снимков. А какой камерой ты обычно снимаешь?' }
    ]
  },
  {
    id: 'example-2',
    title: 'Обсуждение книг и фильмов',
    messages: [
      { sender: 'you', text: 'Привет! Читал(а) что-нибудь интересное в последнее время?' },
      { sender: 'other', text: 'Привет! Да, недавно закончил(а) "Цветы для Элджернона". Очень впечатлила книга.' },
      { sender: 'you', text: 'О, я слышал(а) о ней! Она ведь про эксперимент над человеком с низким IQ, верно? Стоит прочитать?' },
      { sender: 'other', text: 'Да, именно так! Определенно стоит, это очень глубокая история о человечности и интеллекте. А ты что любишь читать?' },
      { sender: 'you', text: 'В основном научную фантастику и детективы. Недавно прочитал(а) "Убийство в Восточном экспрессе", очень понравилось.' }
    ]
  },
  {
    id: 'example-3',
    title: 'Разговор о путешествиях',
    messages: [
      { sender: 'you', text: 'Привет! Если бы ты мог(ла) отправиться в любую страну прямо сейчас, куда бы поехал(а)?' },
      { sender: 'other', text: 'Привет! Наверное, в Японию. Давно мечтаю увидеть сочетание их древних традиций и современных технологий. А ты?' },
      { sender: 'you', text: 'Интересный выбор! Я бы выбрал(а) Исландию — вулканы, гейзеры, северное сияние. Ты уже бывал(а) за границей?' },
      { sender: 'other', text: 'Да, несколько раз был(а) в Европе. Больше всего впечатлила Италия — невероятная архитектура и еда.' },
      { sender: 'you', text: 'Звучит здорово! Какой город в Италии понравился больше всего? И что обязательно стоит попробовать там из еды?' }
    ]
  }
];

// Генерирует случайный совет из выбранной категории
export function getRandomTip(category?: TipCategory): ChatTip {
  const categoryToUse = category || Object.values(TipCategory)[Math.floor(Math.random() * Object.values(TipCategory).length)];
  const tipsInCategory = beginnerTips[categoryToUse];
  return tipsInCategory[Math.floor(Math.random() * tipsInCategory.length)];
}

// Генерирует случайный шаблон сообщения из выбранной категории
export function getRandomTemplate(category?: string): MessageTemplate {
  const templates = category
    ? messageTemplates.filter(t => t.category === category)
    : messageTemplates;

  return templates[Math.floor(Math.random() * templates.length)];
}

// Получить все категории шаблонов сообщений
export function getTemplateCategories(): string[] {
  const categories = new Set<string>();
  messageTemplates.forEach(template => categories.add(template.category));
  return Array.from(categories);
}

// Проверить, является ли пользователь новичком
export function isNewUser(userId: string): boolean {
  // В реальном приложении здесь будет запрос к API
  // Для демонстрации считаем новичком пользователя без чатов или с малым количеством сообщений

  // Получаем статус новичка из localStorage (для демонстрации)
  const newUserStatus = localStorage.getItem(`newUser_${userId}`);
  if (newUserStatus === null) {
    // Если статус не определен, считаем пользователя новичком
    localStorage.setItem(`newUser_${userId}`, 'true');
    return true;
  }

  return newUserStatus === 'true';
}

// Установить статус новичка для пользователя
export function setUserNewStatus(userId: string, isNew: boolean): void {
  localStorage.setItem(`newUser_${userId}`, isNew ? 'true' : 'false');
}

// Получить прогресс обучения
export function getUserOnboardingProgress(userId: string): number {
  const progress = localStorage.getItem(`onboarding_${userId}`);
  return progress ? parseInt(progress) : 0;
}

// Установить прогресс обучения
export function setUserOnboardingProgress(userId: string, progress: number): void {
  localStorage.setItem(`onboarding_${userId}`, progress.toString());
}

// Шаги обучения
export const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Добро пожаловать!',
    content: 'Мы рады приветствовать вас в Анонимном чате! Это место, где вы можете общаться с новыми людьми, оставаясь анонимным. Давайте пройдем краткое обучение, чтобы вы могли начать общение максимально комфортно.',
    buttonText: 'Начать'
  },
  {
    id: 'find-chat',
    title: 'Поиск собеседников',
    content: 'Чтобы начать общение, нажмите кнопку "Найти случайного собеседника" на главной странице. Система подберет вам случайного собеседника на основе ваших интересов.',
    buttonText: 'Далее'
  },
  {
    id: 'chat-tips',
    title: 'Советы по общению',
    content: 'Начните с приветствия и задайте открытый вопрос. Проявляйте интерес к собеседнику, но не делитесь личной информацией. Помните, что на вкладке "Помощь" всегда доступны шаблоны сообщений и полезные советы.',
    buttonText: 'Далее'
  },
  {
    id: 'safety',
    title: 'Безопасность',
    content: 'Мы заботимся о вашей безопасности. Не передавайте личные данные, фотографии или контактную информацию. Если собеседник нарушает правила, воспользуйтесь кнопкой "Пожаловаться".',
    buttonText: 'Далее'
  },
  {
    id: 'complete',
    title: 'Готово!',
    content: 'Теперь вы знаете основы работы с Анонимным чатом. Начните общение и находите новых интересных людей! В любой момент вы можете вернуться в раздел "Помощь" для получения дополнительной информации.',
    buttonText: 'Начать общение'
  }
];
