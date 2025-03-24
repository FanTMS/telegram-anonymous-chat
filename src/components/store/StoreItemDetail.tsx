import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TelegramWebApp {
  WebApp?: {
    colorScheme?: string;
  };
}

declare global {
  interface Window {
    Telegram?: TelegramWebApp;
  }
}
import {
  StoreItem,
  AvatarItem,
  StickerPackItem,
  EmojiPackItem,
  PremiumFeatureItem,
  getDiscountedPrice,
  isItemPurchased
} from '../../utils/store'

interface StoreItemDetailProps {
  item: StoreItem
  userId: string
  onPurchase: (itemId: string) => void
  onClose: () => void
  isPurchased?: boolean
}

// Безопасная обертка для получения цветовой схемы
const getColorScheme = () => {
  try {
    // Проверяем наличие объекта и его свойств
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.colorScheme) {
      return window.Telegram.WebApp.colorScheme;
    }
  } catch (error) {
    console.error('Ошибка при получении цветовой схемы Telegram WebApp:', error);
  }

  // Запасной вариант
  return typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const StoreItemDetail = ({
  item,
  userId,
  onPurchase,
  onClose,
  isPurchased: externalIsPurchased
}: StoreItemDetailProps) => {
  const [isPurchased, setIsPurchased] = useState<boolean>(externalIsPurchased || false)
  const isDarkTheme = getColorScheme() === 'dark';

  // Проверяем, куплен ли товар, если внешний статус не был предоставлен
  useEffect(() => {
    if (externalIsPurchased === undefined) {
      setIsPurchased(isItemPurchased(userId, item.id))
    } else {
      setIsPurchased(externalIsPurchased)
    }
  }, [externalIsPurchased, item.id, userId])

  // Рассчитываем цену со скидкой
  const price = getDiscountedPrice(item)
  const hasDiscount = item.discount && item.discount > 0

  // Обработчик покупки
  const handlePurchase = () => {
    onPurchase(item.id)
    setIsPurchased(true) // Оптимистичное обновление
  }

  // Получаем градиент фона в зависимости от типа товара
  const getCardGradient = () => {
    switch (item.type) {
      case 'avatar':
        return isDarkTheme
          ? 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)'
          : 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)';
      case 'sticker_pack':
        return isDarkTheme
          ? 'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)'
          : 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)';
      case 'emoji_pack':
        return isDarkTheme
          ? 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)'
          : 'linear-gradient(135deg, #FFCF71 0%, #2376DD 100%)';
      case 'premium_feature':
        return isDarkTheme
          ? 'linear-gradient(135deg, #bc4e9c 0%, #f80759 100%)'
          : 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)';
      default:
        return isDarkTheme
          ? 'linear-gradient(135deg, #243B55 0%, #141E30 100%)'
          : 'linear-gradient(135deg, #2980b9 0%, #2c3e50 100%)';
    }
  };

  // Содержимое в зависимости от типа товара
  const renderDetailContent = () => {
    if (item.type === 'avatar') {
      const avatarItem = item as AvatarItem
      return (
        <div className="mb-6">
          <div className="w-full rounded-xl overflow-hidden pt-1/2 relative mb-4"
            style={{ background: getCardGradient() }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-28 w-28 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${avatarItem.avatarUrl})`,
                  border: '4px solid rgba(255, 255, 255, 0.7)'
                }}>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">{item.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium mb-2">О товаре:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Сменить аватар можно в настройках профиля</li>
              <li>Покупка действует бессрочно</li>
              <li>Можно менять аватар в любой момент</li>
            </ul>
          </div>
        </div>
      )
    }

    if (item.type === 'sticker_pack') {
      const stickerItem = item as StickerPackItem
      return (
        <div className="mb-6">
          <div className="w-full rounded-xl overflow-hidden pt-1/2 relative mb-4"
            style={{ background: getCardGradient() }}>
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {stickerItem.stickers && stickerItem.stickers.length > 0 ? (
                  // Показываем стикеры из набора, если они есть
                  stickerItem.stickers.slice(0, 4).map((sticker, index) => (
                    <img
                      key={sticker.id}
                      src={sticker.url || 'https://via.placeholder.com/100?text=Стикер'}
                      alt={`Стикер ${index + 1}`}
                      className="w-16 h-16 object-contain bg-white/10 p-1 rounded-lg shadow-sm"
                      onError={(e) => {
                        // Если изображение не загрузилось, показываем заглушку
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Стикер';
                      }}
                    />
                  ))
                ) : (
                  // Показываем примеры стандартных стикеров как превью
                  <div className="grid grid-cols-2 gap-3">
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-4xl">🐱</div>
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-4xl">🐶</div>
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-4xl">🦊</div>
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-4xl">🐼</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">{item.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium mb-2">О наборе стикеров:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Набор уникальных стикеров для выражения эмоций</li>
              <li>Доступно во всех чатах приложения</li>
              <li>Высокое качество изображений</li>
              <li>Покупка действует бессрочно</li>
            </ul>
          </div>
        </div>
      )
    }

    if (item.type === 'emoji_pack') {
      const emojiItem = item as EmojiPackItem
      return (
        <div className="mb-6">
          <div className="w-full rounded-xl overflow-hidden pt-1/2 relative mb-4"
            style={{ background: getCardGradient() }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-wrap gap-3 justify-center">
                {emojiItem.emojis && emojiItem.emojis.length > 0 ? (
                  // Показываем эмодзи из набора
                  emojiItem.emojis.slice(0, 6).map((emoji, index) => (
                    <div key={index} className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">{emoji}</span>
                    </div>
                  ))
                ) : (
                  // Показываем стандартные эмодзи как превью
                  <>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">😀</span></div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">😍</span></div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">🤣</span></div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">😎</span></div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">🥳</span></div>
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center"><span className="text-3xl">🤩</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">{item.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium mb-2">О наборе эмодзи:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Уникальные эмодзи для выражения эмоций</li>
              <li>Доступно во всех чатах приложения</li>
              <li>Работает в личных и групповых чатах</li>
              <li>Покупка действует бессрочно</li>
            </ul>
          </div>
        </div>
      )
    }

    if (item.type === 'premium_feature') {
      const premiumItem = item as PremiumFeatureItem
      return (
        <div className="mb-6">
          <div className="w-full rounded-xl overflow-hidden pt-1/2 relative mb-4"
            style={{ background: getCardGradient() }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-2">✨</div>
                <div className="bg-white/20 px-4 py-2 rounded-lg text-white font-bold">
                  PREMIUM
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">{item.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 className="font-medium mb-2">Премиум-функции:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {premiumItem.benefits && premiumItem.benefits.length > 0 ? (
                // Показываем фактические преимущества, если они есть
                premiumItem.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))
              ) : (
                // Показываем стандартные преимущества как пример
                <>
                  <li>Доступ к эксклюзивному контенту</li>
                  <li>Приоритетная поддержка</li>
                  <li>Расширенный функционал</li>
                </>
              )}
              <li>Срок действия: {premiumItem.duration || 30} дней</li>
            </ul>
          </div>
        </div>
      )
    }

    // Для любых других типов товаров
    return (
      <div className="mb-6">
        <div className="w-full rounded-xl overflow-hidden pt-1/2 relative mb-4"
          style={{ background: getCardGradient() }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🎁</div>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">{item.name}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium mb-2">О товаре:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Уникальный товар для вашего профиля</li>
            <li>Высокое качество</li>
            <li>Покупка действует бессрочно</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        {/* Бейджи */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
          {item.isPopular && (
            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-md shadow-sm">
              Популярное
            </span>
          )}
          {item.isNew && (
            <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-md shadow-sm">
              Новое
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-md shadow-sm">
              Скидка {item.discount}%
            </span>
          )}
        </div>

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full z-10 transition-all"
        >
          ✕
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1">
        {renderDetailContent()}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400">Цена:</span>
          <div className="flex items-center">
            {hasDiscount ? (
              <>
                <span className="text-md line-through text-gray-400 mr-2">{item.price}</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{price}</span>
              </>
            ) : (
              <span className="text-lg font-bold">{price}</span>
            )}
          </div>
        </div>

        {isPurchased ? (
          <span className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium">
            Куплено
          </span>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePurchase}
            className="tg-button px-6 py-2 rounded-lg"
          >
            Купить
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
