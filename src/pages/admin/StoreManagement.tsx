import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { isAdmin } from '../../utils/user'
import {
  StoreItem,
  StoreItemUnion,
  allStoreItems,
  addStoreItem,
  removeStoreItem,
  updateStoreItem
} from '../../utils/store'

interface UploadFormData {
  id: string
  name: string
  description: string
  price: number
  type: 'avatar' | 'sticker_pack' | 'emoji_pack' | 'premium_feature'
  discount?: number
  isPopular: boolean
  isNew: boolean
  imageUrl: string
}

export const StoreManagement = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [storeItems, setStoreItems] = useState<StoreItemUnion[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<UploadFormData>({
    id: '',
    name: '',
    description: '',
    price: 100,
    type: 'avatar',
    isPopular: false,
    isNew: true,
    imageUrl: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Проверка прав администратора
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/')
      return
    }

    // Загружаем товары магазина
    loadStoreItems()
  }, [navigate])

  // Загрузка товаров магазина
  const loadStoreItems = () => {
    setStoreItems([...allStoreItems])
  }

  // Обработчик изменения формы
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Обработчик редактирования товара
  const handleEditItem = (item: StoreItemUnion) => {
    setIsEditing(true)
    setEditItemId(item.id)

    // Заполняем форму данными товара
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      type: item.type,
      discount: item.discount || 0,
      isPopular: item.isPopular || false,
      isNew: item.isNew || false,
      imageUrl: item.image || ''
    })

    // Прокручиваем страницу вверх к форме
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Обработчик удаления товара
  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        removeStoreItem(itemId)
        loadStoreItems()
        setMessage('Товар успешно удален')
        setMessageType('success')
      } catch (error) {
        setMessage(`Ошибка при удалении товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
        setMessageType('error')
      }
    }
  }

  // Обработчик отправки формы
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Создаем базовый объект товара
      const baseItem: StoreItem = {
        id: isEditing ? editItemId! : `item_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        type: formData.type,
        image: formData.imageUrl,
        discount: formData.discount && formData.discount > 0 ? formData.discount : undefined,
        isPopular: formData.isPopular,
        isNew: formData.isNew
      }

      // Добавляем дополнительные свойства в зависимости от типа
      let itemToSave: StoreItemUnion

      switch (formData.type) {
        case 'avatar':
          itemToSave = {
            ...baseItem,
            type: 'avatar',
            avatarUrl: formData.imageUrl,
            previewUrl: formData.imageUrl,
            bgColor: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)'
          }
          break
        case 'sticker_pack':
          itemToSave = {
            ...baseItem,
            type: 'sticker_pack',
            stickers: [{ id: `s_${Date.now()}`, url: formData.imageUrl }]
          }
          break
        case 'emoji_pack':
          itemToSave = {
            ...baseItem,
            type: 'emoji_pack',
            emojis: ['😀', '😃', '😄', '😁']
          }
          break
        case 'premium_feature':
          itemToSave = {
            ...baseItem,
            type: 'premium_feature',
            featureId: 'custom_feature',
            duration: 30,
            benefits: ['Премиум функция', 'Специальные возможности']
          }
          break
        default:
          throw new Error('Неизвестный тип товара')
      }

      // Сохраняем товар
      if (isEditing) {
        updateStoreItem(itemToSave)
        setMessage(`Товар "${formData.name}" обновлен`)
      } else {
        addStoreItem(itemToSave)
        setMessage(`Товар "${formData.name}" добавлен в магазин`)
      }

      setMessageType('success')

      // Обновляем список товаров
      loadStoreItems()

      // Сбрасываем форму
      resetForm()
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Сброс формы
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      price: 100,
      type: 'avatar',
      isPopular: false,
      isNew: true,
      imageUrl: ''
    })
    setIsEditing(false)
    setEditItemId(null)
  }

  // Функция загрузки изображения
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // В реальном приложении здесь был бы код для загрузки на сервер
    // Для демонстрации просто создаем Data URL
    const reader = new FileReader()
    reader.onload = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Фильтрация товаров по поисковому запросу
  const filteredItems = storeItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.type.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">
        Управление магазином
      </h1>

      {message && (
        <div className={`p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Форма добавления/редактирования товара */}
      <Card className="mb-4">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Редактировать товар' : 'Добавить новый товар'}
        </h2>

        <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Название товара"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Введите название товара"
                required
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Тип товара</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="avatar">Аватар</option>
                <option value="sticker_pack">Набор стикеров</option>
                <option value="emoji_pack">Набор эмодзи</option>
                <option value="premium_feature">Премиум-функция</option>
              </select>
            </div>
          </div>

          <div>
            <Input
              label="Описание"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Введите описание товара"
              as="textarea"
              rows={3}
              required
              fullWidth
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Цена (⭐)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleFormChange}
                min={0}
                required
                fullWidth
              />
            </div>

            <div>
              <Input
                label="Скидка (%)"
                name="discount"
                type="number"
                value={formData.discount || 0}
                onChange={handleFormChange}
                min={0}
                max={100}
                fullWidth
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isNew"
                    checked={formData.isNew}
                    onChange={handleFormChange}
                    className="mr-2"
                  />
                  <span>Новинка</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={formData.isPopular}
                    onChange={handleFormChange}
                    className="mr-2"
                  />
                  <span>Популярное</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Изображение товара</label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <Input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleFormChange}
                  placeholder="URL изображения или загрузите файл"
                  fullWidth
                />
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Загрузить файл
                </Button>
              </div>
            </div>
            {formData.imageUrl && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-32 h-32 object-contain border rounded-md"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
              fullWidth
            >
              {isEditing ? 'Сохранить изменения' : 'Добавить товар'}
            </Button>
            {isEditing && (
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                fullWidth
              >
                Отмена
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Список товаров */}
      <div className="mb-4">
        <Input
          placeholder="Поиск товаров..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Список товаров ({filteredItems.length})</h2>

        {filteredItems.length === 0 ? (
          <Card>
            <div className="py-4 text-center text-gray-500">
              Товары не найдены
            </div>
          </Card>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className="relative">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-24 md:h-24 flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center text-2xl">
                      {item.type === 'avatar' && '👤'}
                      {item.type === 'sticker_pack' && '💬'}
                      {item.type === 'emoji_pack' && '😀'}
                      {item.type === 'premium_feature' && '⭐'}
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg">
                        {item.name}
                        <span className="ml-2 text-sm text-gray-500">{item.id}</span>
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                          {item.type === 'avatar' && 'Аватар'}
                          {item.type === 'sticker_pack' && 'Набор стикеров'}
                          {item.type === 'emoji_pack' && 'Набор эмодзи'}
                          {item.type === 'premium_feature' && 'Премиум-функция'}
                        </span>

                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {item.price}⭐
                        </span>

                        {item.discount && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Скидка {item.discount}%
                          </span>
                        )}

                        {item.isNew && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Новинка
                          </span>
                        )}

                        {item.isPopular && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                            Популярное
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditItem(item)}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <span className="mr-1">✏️</span> Изменить
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <span className="mr-1">🗑️</span> Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Button
        variant="outline"
        onClick={() => navigate('/admin')}
        fullWidth
      >
        <span className="mr-2">⬅️</span> Назад к панели администратора
      </Button>
    </div>
  )
}
