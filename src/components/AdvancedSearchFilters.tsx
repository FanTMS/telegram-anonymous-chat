import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { Input } from './Input'

// Языки для фильтра
const LANGUAGES = [
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'Английский' },
  { id: 'es', name: 'Испанский' },
  { id: 'de', name: 'Немецкий' },
  { id: 'fr', name: 'Французский' },
  { id: 'zh', name: 'Китайский' },
  { id: 'ja', name: 'Японский' },
  { id: 'it', name: 'Итальянский' }
]

// Регионы для фильтра
const REGIONS = [
  { id: 'europe', name: 'Европа' },
  { id: 'asia', name: 'Азия' },
  { id: 'america', name: 'Америка' },
  { id: 'africa', name: 'Африка' },
  { id: 'oceania', name: 'Океания' },
  { id: 'russia', name: 'Россия' },
  { id: 'cis', name: 'СНГ' }
]

export interface SearchFilters {
  ageMin: number | null
  ageMax: number | null
  languages: string[]
  regions: string[]
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onClose: () => void
  expanded?: boolean
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onChange,
  onClose,
  expanded = false
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)
  const [isExpanded, setIsExpanded] = useState(expanded)

  // Обработчик изменения возрастного фильтра
  const handleAgeChange = (type: 'min' | 'max', value: string) => {
    // Преобразуем строку в число или null, если строка пустая
    const numValue = value === '' ? null : parseInt(value)

    setLocalFilters(prev => ({
      ...prev,
      [type === 'min' ? 'ageMin' : 'ageMax']: numValue
    }))
  }

  // Обработчик выбора/отмены выбора языка
  const handleToggleLanguage = (langId: string) => {
    setLocalFilters(prev => {
      const isSelected = prev.languages.includes(langId)
      return {
        ...prev,
        languages: isSelected
          ? prev.languages.filter(id => id !== langId)
          : [...prev.languages, langId]
      }
    })
  }

  // Обработчик выбора/отмены выбора региона
  const handleToggleRegion = (regionId: string) => {
    setLocalFilters(prev => {
      const isSelected = prev.regions.includes(regionId)
      return {
        ...prev,
        regions: isSelected
          ? prev.regions.filter(id => id !== regionId)
          : [...prev.regions, regionId]
      }
    })
  }

  // Применение фильтров
  const handleApply = () => {
    onChange(localFilters)
    onClose()
  }

  // Сброс фильтров
  const handleReset = () => {
    const resetFilters: SearchFilters = {
      ageMin: null,
      ageMax: null,
      languages: [],
      regions: []
    }
    setLocalFilters(resetFilters)
    onChange(resetFilters)
  }

  // Переключение развернутого состояния
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Дополнительные фильтры</h3>
        <span className="text-gray-500 dark:text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Возрастной фильтр */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Возраст</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="от"
                      type="number"
                      min={13}
                      max={100}
                      value={localFilters.ageMin?.toString() || ''}
                      onChange={(e) => handleAgeChange('min', e.target.value)}
                      fullWidth
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="до"
                      type="number"
                      min={13}
                      max={100}
                      value={localFilters.ageMax?.toString() || ''}
                      onChange={(e) => handleAgeChange('max', e.target.value)}
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              {/* Языковый фильтр */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Языки</h4>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <Button
                      key={lang.id}
                      variant={localFilters.languages.includes(lang.id) ? 'primary' : 'outline'}
                      onClick={() => handleToggleLanguage(lang.id)}
                      className="text-xs py-1 px-2"
                    >
                      {lang.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Региональный фильтр */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Регион</h4>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map(region => (
                    <Button
                      key={region.id}
                      variant={localFilters.regions.includes(region.id) ? 'primary' : 'outline'}
                      onClick={() => handleToggleRegion(region.id)}
                      className="text-xs py-1 px-2"
                    >
                      {region.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Сбросить
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Применить
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
