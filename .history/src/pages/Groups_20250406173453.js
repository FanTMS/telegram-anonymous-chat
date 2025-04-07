import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import GroupList from '../components/groups/GroupList';
import { getUserGroups, getPublicGroups, searchGroups } from '../services/groupService';

const GroupsContainer = styled.div`
  padding: 16px;
  padding-bottom: 72px; // Добавляем отступ снизу для нижней навигации
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.1));
`;

const Tab = styled.button`
  flex: 1;
  background: none;
  border: none;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  color: ${props => props.active
        ? 'var(--tg-theme-button-color, #2481cc)'
        : 'var(--tg-theme-text-color, #000)'};
  border-bottom: ${props => props.active
        ? '2px solid var(--tg-theme-button-color, #2481cc)'
        : 'none'};
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 16px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.1));
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--tg-theme-hint-color, #999);
`;

const CreateButton = styled.button`
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border: none;
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  margin: 12px 0;
  
  &:hover {
    opacity: 0.9;
  }
`;

/**
 * Страница групп
 * @param {Object} props - Свойства компонента
 * @param {Object} props.user - Объект пользователя
 */
const Groups = ({ user }) => {
    const [activeTab, setActiveTab] = useState('my');
    const [loading, setLoading] = useState(true);
    const [myGroups, setMyGroups] = useState([]);
    const [publicGroups, setPublicGroups] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const navigate = useNavigate();

    // Загрузка групп пользователя
    useEffect(() => {
        const loadUserGroups = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const groups = await getUserGroups(user.id);
                setMyGroups(groups);
            } catch (err) {
                console.error('Ошибка при загрузке групп пользователя:', err);
            } finally {
                setLoading(false);
            }
        };

        loadUserGroups();
    }, [user?.id]);

    // Загрузка публичных групп
    useEffect(() => {
        const loadPublicGroups = async () => {
            if (activeTab !== 'public') return;

            try {
                setLoading(true);
                const groups = await getPublicGroups();
                setPublicGroups(groups);
            } catch (err) {
                console.error('Ошибка при загрузке публичных групп:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPublicGroups();
    }, [activeTab]);

    // Обработчик поиска групп
    const handleSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);
            setLoading(true);
            const results = await searchGroups(query);
            setSearchResults(results);
        } catch (err) {
            console.error('Ошибка при поиске групп:', err);
        } finally {
            setLoading(false);
        }
    };

    // Обработчик изменения поискового запроса
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Выполняем поиск с дебаунсом
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    };

    // Обработчик клика по группе
    const handleGroupClick = (group) => {
        navigate(`/groups/${group.id}`);
    };

    // Обработчик создания новой группы
    const handleCreateGroup = () => {
        navigate('/groups/create');
    };

    // Определение текущих групп для отображения
    const getDisplayedGroups = () => {
        if (isSearching) {
            return searchResults;
        }

        switch (activeTab) {
            case 'my':
                return myGroups;
            case 'public':
                return publicGroups;
            default:
                return [];
        }
    };

    return (
        <GroupsContainer>
            <h1>Группы</h1>

            <SearchContainer>
                <SearchInput
                    type="text"
                    placeholder="Поиск групп..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                <SearchIcon>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </SearchIcon>
            </SearchContainer>

            {!isSearching && (
                <TabsContainer>
                    <Tab
                        active={activeTab === 'my'}
                        onClick={() => setActiveTab('my')}
                    >
                        Мои группы
                    </Tab>
                    <Tab
                        active={activeTab === 'public'}
                        onClick={() => setActiveTab('public')}
                    >
                        Публичные
                    </Tab>
                </TabsContainer>
            )}

            {!isSearching && activeTab === 'my' && (
                <CreateButton onClick={handleCreateGroup}>
                    Создать новую группу
                </CreateButton>
            )}

            <GroupList
                groups={getDisplayedGroups()}
                loading={loading}
                onGroupClick={handleGroupClick}
                showCreateButton={false}
            />
        </GroupsContainer>
    );
};

export default Groups;
