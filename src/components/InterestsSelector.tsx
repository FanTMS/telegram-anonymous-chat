import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Interest, availableInterests } from '../utils/interests'

interface InterestsSelectorProps {
  selectedInterests: string[]
  onChange: (interests: string[]) => void
  maxSelections?: number
}

export const InterestsSelector = ({
  selectedInterests,
  onChange,
  maxSelections = 5,
}: InterestsSelectorProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedInterests))
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    setSelected(new Set(selectedInterests))
  }, [selectedInterests])

  // Категории интересов
  const categories = [
    { id: 'hobby', name: 'Хобби', icon: '🎨' },
    { id: 'entertainment', name: 'Развлечения', icon: '🎬' },
    { id: 'lifestyle', name: 'Образ жизни', icon: '🌈' },
    { id: 'knowledge', name: 'Знания', icon: '📚' },
    { id: 'other', name: 'Другое', icon: '🔍' }
  ]

  // Фильтрация интересов по поиску и категории
  const filteredInterests = availableInterests.filter((interest: Interest) => {
    const matchesSearch = searchTerm === '' ||
                          interest.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === null || interest.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Обработчик выбора/отмены интереса
  const handleToggleInterest = (interestId: string) => {
    const newSelected = new Set(selected)

    if (newSelected.has(interestId)) {
      newSelected.delete(interestId)
    } else {
      // Проверяем, не превышено ли максимальное количество выбранных интересов
      if (newSelected.size < maxSelections) {
        newSelected.add(interestId)
      } else {
        // Показать уведомление о превышении лимита
        console.warn(`Вы не можете выбрать более ${maxSelections} интересов`)
        return
      }
    }

    setSelected(newSelected)
    onChange(Array.from(newSelected))
  }

  // Обработчик фильтрации по категории
  const handleCategoryFilter = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null) // Снимаем фильтр, если категория уже активна
    } else {
      setActiveCategory(categoryId)
    }
  }

  return (
    <div className="interest-selector">
      {/* Поиск интересов */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск интересов..."
          className="w-full p-2 border rounded-md"
        />
      </div>

      {/* Категории */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map(category => (
          <Button
            key={category.id}
            onClick={() => handleCategoryFilter(category.id)}
            variant={activeCategory === category.id ? 'primary' : 'outline'}
            className="whitespace-nowrap"
          >
            <span className="mr-1">{category.icon}</span> {category.name}
          </Button>
        ))}
      </div>

      {/* Количество выбранных интересов */}
      <div className="mb-3 text-sm">
        Выбрано: {selected.size}/{maxSelections}
      </div>

      {/* Список интересов */}
      <div className="flex flex-wrap gap-2">
        {filteredInterests.length === 0 ? (
          <div className="text-center w-full py-3 text-gray-500">
            Интересы не найдены
          </div>
        ) : (
          filteredInterests.map((interest: Interest) => (
            <Button
              key={interest.id}
              onClick={() => handleToggleInterest(interest.id)}
              variant={selected.has(interest.id) ? 'primary' : 'outline'}
              className="flex items-center"
            >
              <span className="mr-1">{interest.icon}</span>
              {interest.name}
            </Button>
          ))
        )}
      </div>
    </div>
  )
}
