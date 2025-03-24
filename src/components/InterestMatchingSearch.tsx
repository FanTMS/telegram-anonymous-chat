import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { Card } from './Card'
import { InterestsSelector } from './InterestsSelector'
import { getCurrentUser, User } from '../utils/user'
import { AdvancedSearchFilters, SearchFilters } from './AdvancedSearchFilters'

// Расширяем параметры поиска, добавляя дополнительные фильтры
export interface SearchParams {
  interests: string[]
  ageMin?: number | null
  ageMax?: number | null
  languages?: string[]
  regions?: string[]
}

interface InterestMatchingSearchProps {
  onStartSearch: (params: SearchParams) => void
  isSearching: boolean
  onCancelSearch: () => void
}

export const InterestMatchingSearch: React.FC<InterestMatchingSearchProps> = ({
  onStartSearch,
  isSearching,
  onCancelSearch
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [error, setError] = useState('')
  const [showUserInterests, setShowUserInterests] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({
    ageMin: null,
    ageMax: null,
    languages: [],
    regions: []
  })

  // Загружаем текущего пользователя при монтировании компонента
  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)

    // Если у пользователя есть интересы, предварительно выбираем их
    if (user && user.interests && user.interests.length > 0) {
      setSelectedInterests(user.interests.slice(0, 3)) // Выбираем до 3-х интересов пользователя
    }
  }, [])

  // Обработчик изменения выбранных интересов
  const handleInterestsChange = (interests: string[]) => {
    setSelectedInterests(interests)
    setError('')
  }

  // Обработчик использования интересов пользователя
  const handleUseUserInterests = () => {
    if (currentUser && currentUser.interests && currentUser.interests.length > 0) {
      setSelectedInterests(currentUser.interests.slice(0, 3))
      setShowUserInterests(false)
    }
  }

  // Обработчик изменения дополнительных фильтров
  const handleAdvancedFiltersChange = (filters: SearchFilters) => {
    setAdvancedFilters(filters)
  }

  // Обработчик начала поиска
  const handleStartSearch = () => {
    // Объединяем все параметры поиска
    const searchParams: SearchParams = {
      interests: selectedInterests,
      ageMin: advancedFilters.ageMin,
      ageMax: advancedFilters.ageMax,
      languages: advancedFilters.languages.length > 0 ? advancedFilters.languages : undefined,
      regions: advancedFilters.regions.length > 0 ? advancedFilters.regions : undefined
    }

    onStartSearch(searchParams)
  }

  // Получаем информацию о применяемых фильтрах для отображения
  const getAppliedFiltersInfo = () => {
    const filters = []

    if (advancedFilters.ageMin !== null && advancedFilters.ageMax !== null) {
      filters.push(`Возраст: ${advancedFilters.ageMin} - ${advancedFilters.ageMax}`)
    } else if (advancedFilters.ageMin !== null) {
      filters.push(`Возраст: от ${advancedFilters.ageMin}`)
    } else if (advancedFilters.ageMax !== null) {
      filters.push(`Возраст: до ${advancedFilters.ageMax}`)
    }

    if (advancedFilters.languages.length > 0) {
      filters.push(`Языки: ${advancedFilters.languages.length}`)
    }

    if (advancedFilters.regions.length > 0) {
      filters.push(`Регионы: ${advancedFilters.regions.length}`)
    }

    return filters
  }

  const appliedFilters = getAppliedFiltersInfo()

  return (
    <Card className="p-5 border border-blue-100 shadow-lg bg-white bg-opacity-90 backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold mb-2 text-blue-600">Поиск собеседника по интересам</h2>
          <p className="text-sm text-gray-600">
            Выберите интересы, чтобы найти собеседника с похожими увлечениями
          </p>
        </div>

        {currentUser && currentUser.interests && currentUser.interests.length > 0 && !showUserInterests && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-3 rounded-md border border-blue-200"
          >
            <p className="text-sm text-blue-700 mb-2">
              У вас уже есть выбранные интересы в профиле:
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentUser.interests.slice(0, 5).map((interest) => (
                <span key={interest} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
            <Button
              onClick={handleUseUserInterests}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-1"
            >
              Использовать эти интересы
            </Button>
          </motion.div>
        )}

        <div className="border rounded-md p-3">
          <InterestsSelector
            selectedInterests={selectedInterests}
            onChange={handleInterestsChange}
            maxSelections={3}
          />
        </div>

        {/* Переключатель дополнительных фильтров */}
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full text-sm justify-center"
          >
            {showAdvancedFilters ? 'Скрыть дополнительные фильтры' : 'Показать дополнительные фильтры'}
            <span className="ml-1">{showAdvancedFilters ? '▲' : '▼'}</span>
          </Button>

          {/* Отображение применяемых фильтров */}
          {!showAdvancedFilters && appliedFilters.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {appliedFilters.map((filter, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Компонент дополнительных фильтров */}
        {showAdvancedFilters && (
          <AdvancedSearchFilters
            filters={advancedFilters}
            onChange={handleAdvancedFiltersChange}
            onClose={() => setShowAdvancedFilters(false)}
            expanded={true}
          />
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm"
          >
            {error}
          </motion.div>
        )}

        {isSearching ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-center text-gray-600 text-sm">Ищем собеседника с подходящими параметрами...</p>
            <Button
              onClick={onCancelSearch}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 mt-2"
            >
              Отменить поиск
            </Button>
          </div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleStartSearch}
              fullWidth
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md"
            >
              {selectedInterests.length > 0
                ? `Найти собеседника по ${selectedInterests.length} интересам`
                : 'Найти случайного собеседника'}
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
