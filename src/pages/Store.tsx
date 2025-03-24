import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  allStoreItems,
  StoreItem,
  StoreItemUnion,
  getUserPurchases,
  purchaseItem,
  getUserCurrency,
  addCurrency
} from '../utils/store'
import { getCurrentUser } from '../utils/user'
import { StoreItemCard } from '../components/store/StoreItemCard'
import { StoreItemDetail } from '../components/store/StoreItemDetail'

// Тип для фильтра товаров
type FilterType = 'all' | 'avatar' | 'sticker_pack' | 'emoji_pack' | 'premium_feature'

// Безопасная обертка для методов WebApp API
const safeWebApp = {
  showPopup: (params: any) => {
    try {
      if (WebApp && typeof WebApp.showPopup === 'function') {
        WebApp.showPopup(params);
      } else {
        console.log('WebApp.showPopup не поддерживается:', params);
        alert(params.message || 'Сообщение WebApp');
      }
    } catch (error) {
      console.error('Ошибка при вызове WebApp.showPopup:', error);
      alert(params.message || 'Сообщение WebApp');
    }
  },
  showAlert: (message: string) => {
    try {
      if (WebApp && typeof WebApp.showAlert === 'function') {
        WebApp.showAlert(message);
      } else {
        console.log('WebApp.showAlert не поддерживается:', message);
        alert(message);
      }
    } catch (error) {
      console.error('Ошибка при вызове WebApp.showAlert:', error);
      alert(message);
    }
  },
  getColorScheme: () => {
    try {
      if (WebApp && WebApp.colorScheme) {
        return WebApp.colorScheme;
      }
    } catch (error) {
      console.error('Ошибка при получении WebApp.colorScheme:', error);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

export const Store = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all')
  const [filteredItems, setFilteredItems] = useState<StoreItemUnion[]>([])
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set())
  const [userBalance, setUserBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Получаем данные пользователя и его покупки
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const user = getCurrentUser()
        if (!user) {
          navigate('/')
          return
        }

        // Сохраняем ID пользователя
        setUserId(user.id)

        // Получаем текущий баланс
        const currency = getUserCurrency(user.id)
        setUserBalance(currency.balance)

        // Получаем покупки пользователя
        const purchases = getUserPurchases(user.id)
        const purchasedItemsSet = new Set(purchases.map(p => p.itemId))
        setPurchasedItems(purchasedItemsSet)

        // Фильтруем товары
        filterItems('all')
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error)
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData()
  }, [navigate])

  // Функция для фильтрации товаров
  const filterItems = useCallback((filter: FilterType, search: string = searchTerm) => {
    let items = [...allStoreItems]

    // Фильтрация по типу
    if (filter !== 'all') {
      items = items.filter(item => item.type === filter)
    }

    // Фильтрация по поисковому запросу
    if (search) {
      const term = search.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      )
    }

    // Популярные товары всегда в начале списка
    items.sort((a, b) => {
      // Сначала сортируем по популярности
      if (a.isPopular && !b.isPopular) return -1
      if (!a.isPopular && b.isPopular) return 1

      // Затем по новизне
      if (a.isNew && !b.isNew) return -1
      if (!a.isNew && b.isNew) return 1

      return 0
    })

    setFilteredItems(items)
    setSelectedFilter(filter)
  }, [searchTerm])

  // Обработчик изменения поискового запроса
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    filterItems(selectedFilter, value)
  }

  // Обработчик покупки товара
  const handlePurchase = (itemId: string) => {
    // Находим товар по ID
    const item = allStoreItems.find(i => i.id === itemId)
    if (!item) {
      safeWebApp.showAlert('Товар не найден')
      return
    }

    // Пытаемся совершить покупку
    const success = purchaseItem(userId, itemId)

    if (success) {
      // Обновляем список покупок
      setPurchasedItems(prev => {
        const newSet = new Set(prev)
        newSet.add(itemId)
        return newSet
      })

      // Обновляем баланс
      const currency = getUserCurrency(userId)
      setUserBalance(currency.balance)

      // Закрываем диалог с деталями товара
      if (selectedItem && selectedItem.id === itemId) {
        setSelectedItem(null)
      }

      safeWebApp.showPopup({
        title: 'Покупка успешна',
        message: `Вы успешно приобрели "${item.name}"!`,
        buttons: [{ type: 'ok' }]
      });
    } else {
      // Показываем сообщение о недостаточном балансе
      safeWebApp.showAlert('Недостаточно средств для покупки. Пополните баланс.')
    }
  }

  // Обработчик обновления баланса
  const handleBalanceUpdate = (newBalance: number) => {
    setUserBalance(newBalance)
  }

  // Обработчик просмотра деталей товара
  const handleViewItem = (item: StoreItem) => {
    setSelectedItem(item)
  }

  // Обработчик закрытия деталей товара
  const handleCloseItemDetails = () => {
    setSelectedItem(null)
  }

  // Обработчик добавления тестовой валюты - теперь показывает сообщение о будущей доступности
  const handleAddTestCurrency = () => {
    safeWebApp.showPopup({
      title: 'Скоро',
      message: 'Пополнение баланса будет доступно в ближайшее время',
      buttons: [{ type: 'ok' }]
    });
  }

  // Определяем количество товаров в каждой категории для отображения счетчиков
  const avatarCount = allStoreItems.filter(item => item.type === 'avatar').length
  const stickerCount = allStoreItems.filter(item => item.type === 'sticker_pack').length
  const emojiCount = allStoreItems.filter(item => item.type === 'emoji_pack').length
  const premiumCount = allStoreItems.filter(item => item.type === 'premium_feature').length

  return (
    <div className="tg-container pb-16">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Верхняя часть с балансом и поиском */}
        <div className="flex flex-col justify-between mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="tg-header mb-0">Магазин</h1>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 flex items-center">
              <span className="text-yellow-500 mr-1.5">💰</span>
              <span className="font-medium">{userBalance}</span>
              <button
                onClick={handleAddTestCurrency}
                className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full transition-colors"
                aria-label="Пополнить баланс"
              >
                +
              </button>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="tg-input w-full pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
              placeholder="Поиск товаров..."
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Фильтры категорий */}
        <div className="flex overflow-x-auto pb-2 mb-4 no-scrollbar">
          <div className="flex space-x-2">
            <button
              onClick={() => filterItems('all')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl border transition-colors ${selectedFilter === 'all'
                ? 'tg-button'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
            >
              Все <span className="opacity-75">({allStoreItems.length})</span>
            </button>
            <button
              onClick={() => filterItems('avatar')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl border transition-colors ${selectedFilter === 'avatar'
                ? 'tg-button'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
            >
              Аватары <span className="opacity-75">({avatarCount})</span>
            </button>
            <button
              onClick={() => filterItems('sticker_pack')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl border transition-colors ${selectedFilter === 'sticker_pack'
                ? 'tg-button'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
            >
              Стикеры <span className="opacity-75">({stickerCount})</span>
            </button>
            <button
              onClick={() => filterItems('emoji_pack')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl border transition-colors ${selectedFilter === 'emoji_pack'
                ? 'tg-button'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
            >
              Эмодзи <span className="opacity-75">({emojiCount})</span>
            </button>
            <button
              onClick={() => filterItems('premium_feature')}
              className={`whitespace-nowrap px-3 py-2 rounded-xl border transition-colors ${selectedFilter === 'premium_feature'
                ? 'tg-button'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}
            >
              Премиум <span className="opacity-75">({premiumCount})</span>
            </button>
          </div>
        </div>

        {/* Состояние загрузки */}
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Сетка товаров */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      <StoreItemCard
                        item={item}
                        userId={userId}
                        onPurchase={handlePurchase}
                        onView={handleViewItem}
                        isPurchased={purchasedItems.has(item.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg mb-2">По вашему запросу ничего не найдено</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Попробуйте изменить параметры поиска или категорию
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    filterItems('all', '');
                  }}
                  className="tg-button-sm"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </>
        )}

        {/* Детальный просмотр товара */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={handleCloseItemDetails}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <StoreItemDetail
                  item={selectedItem}
                  userId={userId}
                  onPurchase={handlePurchase}
                  onClose={handleCloseItemDetails}
                  isPurchased={purchasedItems.has(selectedItem.id)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
