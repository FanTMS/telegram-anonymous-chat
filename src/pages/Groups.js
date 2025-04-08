import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import GroupList from '../components/groups/GroupList';
import { getUserGroups, getPublicGroups } from '../services/groupService';
import SearchInput from '../components/SearchInput';
import { motion, AnimatePresence } from 'framer-motion';

const GroupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  position: relative;
  background-color: var(--tg-theme-bg-color, #ffffff);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const GroupsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  position: sticky;
  top: 0;
  background-color: var(--tg-theme-bg-color, #ffffff);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding-top: calc(16px + env(safe-area-inset-top, 0));
`;

const TabsContainer = styled.div`
  display: flex;
  background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  border-radius: 8px;
  padding: 2px;
  margin: 16px 0;
`;

const Tab = styled.button`
  flex: 1;
  background: ${props => props.active === 'true'
        ? 'var(--tg-theme-bg-color, #fff)'
        : 'transparent'};
  border: none;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  color: var(--tg-theme-text-color, #000);
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: ${props => props.active === 'true' ? '500' : 'normal'};
  box-shadow: ${props => props.active === 'true'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : 'none'};
  
  &:hover {
    background-color: ${props => props.active === 'true'
        ? 'var(--tg-theme-bg-color, #fff)'
        : 'rgba(0, 0, 0, 0.03)'};
  }
`;

const SearchContainer = styled.div`
  margin-top: 8px;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--tg-theme-destructive-color, #ff3b30);
  font-size: 14px;
`;

const SearchNotFound = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: var(--tg-theme-hint-color, #999);
  font-size: 14px;
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    fill: var(--tg-theme-hint-color, #999);
    opacity: 0.5;
  }
`;

const GroupsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const Groups = ({ user }) => {
    const [activeTab, setActiveTab] = useState('my');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [myGroups, setMyGroups] = useState([]);
    const [publicGroups, setPublicGroups] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const navigate = useNavigate();

    // Загрузка групп пользователя
    useEffect(() => {
        const loadUserGroups = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const groups = await getUserGroups(user.id);
                setMyGroups(Array.isArray(groups) ? groups : []);
            } catch (err) {
                console.error("Ошибка при загрузке групп пользователя:", err);
                setError("Не удалось загрузить группы. Пожалуйста, попробуйте позже.");
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
                setError(null);
                const groups = await getPublicGroups();
                setPublicGroups(Array.isArray(groups) ? groups : []);
            } catch (err) {
                console.error("Ошибка при загрузке публичных групп:", err);
                setError("Не удалось загрузить публичные группы. Пожалуйста, попробуйте позже.");
            } finally {
                setLoading(false);
            }
        };

        // Загрузка данных при активации вкладки
        loadPublicGroups();

        // Обновление данных каждые 30 секунд, если вкладка активна
        const intervalId = setInterval(() => {
            if (activeTab === 'public') {
                loadPublicGroups();
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [activeTab]);

    // Поиск групп
    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        try {
            // Для простоты выполним поиск локально по загруженным группам
            const searchGroups = activeTab === 'my' ? myGroups : publicGroups;
            const results = searchGroups.filter(group =>
                group.name.toLowerCase().includes(query.toLowerCase()) ||
                (group.description && group.description.toLowerCase().includes(query.toLowerCase()))
            );

            setSearchResults(results);
        } catch (err) {
            console.error("Ошибка при поиске групп:", err);
        }
    };

    // Выбор отображаемых групп в зависимости от активного таба и поиска
    const getDisplayedGroups = () => {
        if (isSearching) {
            return searchResults;
        }

        return activeTab === 'my' ? myGroups : publicGroups;
    };

    return (
        <GroupsContainer>
            <GroupsHeader>
                <h1>Группы</h1>

                <TabsContainer>
                    <Tab
                        active={activeTab === 'my' ? 'true' : 'false'}
                        onClick={() => setActiveTab('my')}
                    >
                        Мои группы
                    </Tab>
                    <Tab
                        active={activeTab === 'public' ? 'true' : 'false'}
                        onClick={() => setActiveTab('public')}
                    >
                        Публичные
                    </Tab>
                </TabsContainer>

                <SearchContainer>
                    <SearchInput
                        placeholder="Поиск групп..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onClear={() => handleSearch('')}
                    />
                </SearchContainer>
            </GroupsHeader>

            {error && (
                <ErrorMessage>{error}</ErrorMessage>
            )}

            <AnimatePresence mode="wait">
                {isSearching && searchResults.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <SearchNotFound>
                            <svg viewBox="0 0 24 24">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <div>По запросу "{searchQuery}" ничего не найдено</div>
                        </SearchNotFound>
                    </motion.div>
                )}

                {!isSearching || searchResults.length > 0 ? (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <GroupList
                            groups={getDisplayedGroups()}
                            onGroupClick={(group) => navigate(`/groups/${group.id}`)}
                            showCreateButton={activeTab === 'my'}
                            isLoading={loading}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </GroupsContainer>
    );
};

export default Groups;
