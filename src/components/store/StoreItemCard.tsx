import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  StoreItem,
  AvatarItem,
  PremiumFeatureItem,
  getDiscountedPrice,
  isItemPurchased
} from '../../utils/store'

interface StoreItemCardProps {
  item: StoreItem
  userId: string
  onPurchase: (itemId: string) => void
  onView?: (item: StoreItem) => void
  isPurchased?: boolean
  className?: string
}

// Безопасная обертка для получения цветовой схемы
const getColorScheme = () => {
  try {
    // Сначала проверяем WebApp из @twa-dev/sdk
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.colorScheme) {
      return window.Telegram.WebApp.colorScheme;
    }
  } catch (error) {
    console.error('Ошибка при получении цветовой схемы Telegram WebApp:', error);
  }

  // Запасной вариант - определение по системным настройкам
  return typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const StoreItemCard = ({
  item,
  userId,
  onPurchase,
  onView,
  isPurchased: externalIsPurchased,
  className = ''
}: StoreItemCardProps) => {
  // Используем внешнее значение если оно предоставлено, иначе проверяем сами
  const [isPurchased, setIsPurchased] = useState<boolean | undefined>(externalIsPurchased)
  const isDarkTheme = getColorScheme() === 'dark';

  // Проверяем, куплен ли товар пользователем, если внешнее значение не предоставлено
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

  // Функция для определения фонового цвета в зависимости от типа товара
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

  // Рендерим изображение товара
  const renderItemImage = () => {
    // Для аватаров показываем аватарку
    if (item.type === 'avatar') {
      const avatarItem = item as AvatarItem
      return (
        <div className="rounded-lg overflow-hidden h-28 flex items-center justify-center"
          style={{ background: getCardGradient() }}>
          <div
            className="h-20 w-20 rounded-full bg-cover bg-center shadow-md"
            style={{
              backgroundImage: `url(${avatarItem.avatarUrl || 'https://via.placeholder.com/100?text=Avatar'})`,
              border: '3px solid rgba(255, 255, 255, 0.7)'
            }}>
          </div>
        </div>
      )
    }

    // Для премиум-функций показываем иконку
    if (item.type === 'premium_feature') {
      return (
        <div className="rounded-lg overflow-hidden h-28 flex items-center justify-center"
          style={{ background: getCardGradient() }}>
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-1">✨</div>
            <div className="bg-white/20 px-2 py-0.5 rounded text-xs text-white font-medium">
              PREMIUM
            </div>
          </div>
        </div>
      )
    }

    // Для стикеров показываем превью стикеров
    if (item.type === 'sticker_pack') {
      return (
        <div className="rounded-lg overflow-hidden h-28 flex items-center justify-center"
          style={{ background: getCardGradient() }}>
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center text-xl">🐱</div>
            <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center text-xl">🐶</div>
            <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center text-xl">🦊</div>
            <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center text-xl">🐼</div>
          </div>
        </div>
      )
    }

    // Для эмодзи показываем примеры
    if (item.type === 'emoji_pack') {
      return (
        <div className="rounded-lg overflow-hidden h-28 flex items-center justify-center"
          style={{ background: getCardGradient() }}>
          <div className="flex flex-wrap gap-1 max-w-[100px] justify-center">
            <span className="text-xl">😀</span>
            <span className="text-xl">😍</span>
            <span className="text-xl">🤣</span>
            <span className="text-xl">😎</span>
          </div>
        </div>
      )
    }

    // Для всех остальных типов используем стандартное изображение или градиент
    return (
      <div className="rounded-lg overflow-hidden h-28 flex items-center justify-center"
        style={{ background: getCardGradient() }}>
        <div className="text-white text-5xl opacity-75">🎁</div>
      </div>
    )
  }

  // Рендерим бейджи товара (популярный, новый, со скидкой)
  const renderBadges = () => {
    return (
      <div className="absolute top-2 left-2 flex flex-col space-y-1">
        {item.isPopular && (
          <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-md shadow-sm">
            Популярное
          </span>
        )}
        {item.isNew && (
          <span className="px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-md shadow-sm">
            Новое
          </span>
        )}
        {hasDiscount && (
          <span className="px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-md shadow-sm">
            -{item.discount}%
          </span>
        )}
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative ${className}`}
      onClick={() => onView && onView(item)}
    >
      {/* Изображение товара */}
      {renderItemImage()}

      {/* Бейджи */}
      {renderBadges()}

      {/* Информация о товаре */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-1 mb-1">{item.name}</h3>

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-xs line-through text-gray-500 dark:text-gray-400">
                  {item.price}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">{price}</span>
              </div>
            ) : (
              <span className="font-medium">{price}</span>
            )}
          </div>

          {isPurchased ? (
            <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
              Куплено
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPurchase(item.id)
              }}
              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Купить
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
