import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
    getAllGroups,
    Group,
    createGroup,
    getUserGroups,
    joinGroup
} from '../utils/groups'
import { getCurrentUser } from '../utils/user'

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

// Компонент карточки группы
const GroupCard: React.FC<{
    group: Group,
    onClick: () => void
}> = ({ group, onClick }) => {
    const isDarkTheme = safeWebApp.getColorScheme() === 'dark';

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="tg-card cursor-pointer mb-3 shadow-sm"
            onClick={onClick}
        >
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg truncate flex-1">{group.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ml-2 ${group.isAnonymous
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                        {group.isAnonymous ? 'Анонимная' : 'Публичная'}
                    </span>
                </div>

                <p className={`text-sm mb-3 line-clamp-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                    {group.description || 'Нет описания'}
                </p>

                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                            👥 {group.memberCount || 0} {getCorrectWordForm(group.memberCount || 0)}
                        </span>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="tg-button-sm"
                    >
                        Открыть
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}

// Определяем правильную форму слова "участник"
const getCorrectWordForm = (count: number): string => {
    if (count % 10 === 1 && count % 100 !== 11) {
        return 'участник';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return 'участника';
    } else {
        return 'участников';
    }
};

// Основной компонент страницы Группы
const GroupsPage: React.FC = () => {
    const navigate = useNavigate()
    const [groups, setGroups] = useState<Group[]>([])
    const [myGroups, setMyGroups] = useState<Group[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'anonymous' | 'public'>('all')
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDescription, setNewGroupDescription] = useState('')
    const [newGroupIsAnonymous, setNewGroupIsAnonymous] = useState(false)
    const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false)

    // Загрузка списка групп
    useEffect(() => {
        const loadGroups = async () => {
            try {
                setIsLoading(true)
                const currentUser = getCurrentUser()
                if (!currentUser) {
                    navigate('/')
                    return
                }

                // Загружаем группы пользователя
                const userGroups = getUserGroups()
                setMyGroups(userGroups)

                // Загружаем все группы
                const loadedGroups = getAllGroups()
                setGroups(loadedGroups)
            } catch (error) {
                console.error('Ошибка при загрузке групп:', error)
                safeWebApp.showPopup({
                    title: 'Ошибка',
                    message: 'Не удалось загрузить список групп',
                    buttons: [{ type: 'ok' }]
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadGroups()
    }, [navigate])

    // Обработчик перехода к группе
    const handleGroupClick = (groupId: string) => {
        navigate(`/group/${groupId}`)
    }

    // Создание новой группы
    const handleCreateGroup = () => {
        if (!newGroupName.trim()) {
            safeWebApp.showPopup({
                title: 'Ошибка',
                message: 'Название группы не может быть пустым',
                buttons: [{ type: 'ok' }]
            })
            return
        }

        try {
            const currentUser = getCurrentUser()
            if (!currentUser) {
                safeWebApp.showPopup({
                    title: 'Ошибка',
                    message: 'Необходимо авторизоваться для создания группы',
                    buttons: [{ type: 'ok' }]
                })
                return
            }

            // Вызов функции в соответствии с её фактической сигнатурой
            const newGroup = createGroup(
                newGroupName.trim(),
                newGroupDescription.trim(),
                newGroupIsAnonymous,
                newGroupIsPrivate,
                [] // tags
            )

            if (newGroup) {
                setGroups(prev => [newGroup, ...prev])
                setMyGroups(prev => [newGroup, ...prev])
                setNewGroupName('')
                setNewGroupDescription('')
                setNewGroupIsAnonymous(false)
                setNewGroupIsPrivate(false)
                setShowCreateForm(false)

                safeWebApp.showPopup({
                    title: 'Успех',
                    message: 'Группа успешно создана',
                    buttons: [{ type: 'ok' }]
                })
            }
        } catch (error) {
            console.error('Ошибка при создании группы:', error)
            safeWebApp.showPopup({
                title: 'Ошибка',
                message: 'Не удалось создать группу',
                buttons: [{ type: 'ok' }]
            })
        }
    }

    // Получаем отфильтрованный список групп в зависимости от активной вкладки
    const getFilteredGroupsList = () => {
        const sourceGroups = activeTab === 'my' ? myGroups : groups;

        return sourceGroups
            .filter(group =>
                // Добавляем проверку на существование name и description перед вызовом toLowerCase()
                (group.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (group.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
            )
            .filter(group => {
                if (filter === 'all') return true
                if (filter === 'anonymous') return group.isAnonymous
                if (filter === 'public') return !group.isAnonymous
                return true
            });
    }

    const filteredGroups = getFilteredGroupsList();

    // Подсчет количества групп для статистики
    const groupStats = {
        all: groups.length,
        anonymous: groups.filter(group => group.isAnonymous).length,
        public: groups.filter(group => !group.isAnonymous).length,
        my: myGroups.length
    };

    return (
        <div className="tg-container pb-16">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h1 className="tg-header mb-0">Группы</h1>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="tg-button-primary"
                    >
                        {showCreateForm ? 'Отмена' : 'Создать группу'}
                    </motion.button>
                </div>

                {/* Вкладки для переключения между "Все группы" и "Мои группы" */}
                <div className="flex rounded-xl overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700 p-1">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors rounded-lg ${activeTab === 'all'
                            ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                    >
                        Все группы ({groupStats.all})
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors rounded-lg ${activeTab === 'my'
                            ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                    >
                        Мои группы ({groupStats.my})
                    </button>
                </div>

                {/* Форма создания группы */}
                <AnimatePresence>
                    {showCreateForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="tg-card p-4 mb-4 bg-white dark:bg-gray-800 shadow-md">
                                <h3 className="font-medium text-lg mb-3">Создание новой группы</h3>

                                <div className="mb-3">
                                    <label className="block text-sm mb-1 font-medium">Название группы*</label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="tg-input w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                                        placeholder="Введите название группы"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm mb-1 font-medium">Описание</label>
                                    <textarea
                                        value={newGroupDescription}
                                        onChange={(e) => setNewGroupDescription(e.target.value)}
                                        className="tg-input w-full resize-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                                        placeholder="Добавьте описание группы"
                                        rows={3}
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="flex items-center tg-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={newGroupIsAnonymous}
                                            onChange={(e) => setNewGroupIsAnonymous(e.target.checked)}
                                            className="tg-checkbox-input"
                                        />
                                        <span className="tg-checkbox-mark"></span>
                                        <span className="ml-2">Анонимная группа</span>
                                    </label>
                                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 ml-6">
                                        В анонимных группах участники видят случайные имена вместо реальных
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="flex items-center tg-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={newGroupIsPrivate}
                                            onChange={(e) => setNewGroupIsPrivate(e.target.checked)}
                                            className="tg-checkbox-input"
                                        />
                                        <span className="tg-checkbox-mark"></span>
                                        <span className="ml-2">Приватная группа</span>
                                    </label>
                                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 ml-6">
                                        Приватные группы не отображаются в общем списке и доступны только по приглашению
                                    </p>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowCreateForm(false)}
                                        className="tg-button-outline flex-1"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleCreateGroup}
                                        className="tg-button flex-1"
                                    >
                                        Создать группу
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Поиск и фильтры */}
                <div className="mb-4">
                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="tg-input w-full pl-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                            placeholder="Поиск групп..."
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            🔍
                        </span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-2 overflow-x-auto py-1 scrollbar-hide">
                        <button
                            onClick={() => setFilter('all')}
                            className={`tg-filter-btn ${filter === 'all' ? 'tg-filter-btn-active' : ''}`}
                        >
                            Все <span className="opacity-70">({groupStats.all})</span>
                        </button>
                        <button
                            onClick={() => setFilter('public')}
                            className={`tg-filter-btn ${filter === 'public' ? 'tg-filter-btn-active' : ''}`}
                        >
                            Публичные <span className="opacity-70">({groupStats.public})</span>
                        </button>
                        <button
                            onClick={() => setFilter('anonymous')}
                            className={`tg-filter-btn ${filter === 'anonymous' ? 'tg-filter-btn-active' : ''}`}
                        >
                            Анонимные <span className="opacity-70">({groupStats.anonymous})</span>
                        </button>
                    </div>
                </div>

                {/* Список групп */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="spinner"></div>
                    </div>
                ) : filteredGroups.length > 0 ? (
                    <AnimatePresence>
                        {filteredGroups.map(group => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                onClick={() => handleGroupClick(group.id)}
                            />
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-lg mb-2">
                            {searchQuery || filter !== 'all'
                                ? 'Не найдено групп, соответствующих критериям поиска'
                                : activeTab === 'my'
                                    ? 'У вас пока нет групп'
                                    : 'Нет доступных групп'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery || filter !== 'all'
                                ? 'Попробуйте изменить параметры поиска'
                                : 'Создайте свою первую группу, нажав на кнопку "Создать группу"'}
                        </p>
                    </div>
                )}

                {/* Плавающая кнопка создания группы для мобильных */}
                {!showCreateForm && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateForm(true)}
                        className="fixed bottom-24 right-4 w-14 h-14 rounded-full tg-button flex items-center justify-center shadow-lg lg:hidden"
                    >
                        <span className="text-2xl">+</span>
                    </motion.button>
                )}
            </motion.div>
        </div>
    )
}

export default GroupsPage
