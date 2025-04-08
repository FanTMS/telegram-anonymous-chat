import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    startAfter, 
    limit, 
    getDocs,
    doc,
    getDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import '../styles/AdminUsers.css';

const AdminUsers = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [userStatus, setUserStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');

    const usersPerPage = 20;

    useEffect(() => {
        fetchUsers(true);
    }, [filter]);

    const fetchUsers = async (resetPage = false) => {
        try {
            setLoading(true);
            
            if (resetPage) {
                setPage(1);
                setLastVisible(null);
            }
            
            const usersRef = collection(db, 'users');
            let baseQuery;
            
            switch (filter) {
                case 'active':
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
                    
                    baseQuery = query(
                        usersRef,
                        where('lastActive', '>=', sevenDaysAgoTimestamp),
                        orderBy('lastActive', 'desc')
                    );
                    break;
                case 'banned':
                    baseQuery = query(
                        usersRef,
                        where('status', '==', 'banned'),
                        orderBy('bannedAt', 'desc')
                    );
                    break;
                case 'admins':
                    baseQuery = query(
                        usersRef,
                        where('isAdmin', '==', true),
                        orderBy('username', 'asc')
                    );
                    break;
                case 'new':
                    baseQuery = query(
                        usersRef,
                        orderBy('createdAt', 'desc')
                    );
                    break;
                default:
                    baseQuery = query(
                        usersRef,
                        orderBy('username', 'asc')
                    );
            }
            
            // Применяем пагинацию
            let paginatedQuery;
            if (lastVisible && !resetPage) {
                paginatedQuery = query(
                    baseQuery, 
                    startAfter(lastVisible), 
                    limit(usersPerPage)
                );
            } else {
                paginatedQuery = query(
                    baseQuery, 
                    limit(usersPerPage)
                );
            }
            
            const querySnapshot = await getDocs(paginatedQuery);
            
            // Проверяем, есть ли еще записи
            setHasMore(querySnapshot.docs.length === usersPerPage);
            
            // Сохраняем последний видимый документ для пагинации
            if (querySnapshot.docs.length > 0) {
                setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            } else {
                setLastVisible(null);
                setHasMore(false);
            }
            
            const usersData = [];
            
            for (const userDoc of querySnapshot.docs) {
                const userData = userDoc.data();
                
                // Если есть поисковый запрос, фильтруем
                if (searchTerm && !userMatchesSearch(userData, searchTerm)) {
                    continue;
                }
                
                // Добавляем информацию о пользователе в массив
                usersData.push({
                    id: userDoc.id,
                    ...userData,
                    createdAt: userData.createdAt ? (typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate() : userData.createdAt) : null,
                    lastActive: userData.lastActive ? (typeof userData.lastActive.toDate === 'function' ? userData.lastActive.toDate() : userData.lastActive) : null,
                    bannedAt: userData.bannedAt ? (typeof userData.bannedAt.toDate === 'function' ? userData.bannedAt.toDate() : userData.bannedAt) : null
                });
            }
            
            if (resetPage) {
                setUsers(usersData);
            } else {
                setUsers(prevUsers => [...prevUsers, ...usersData]);
            }
            
        } catch (err) {
            console.error('Ошибка при получении списка пользователей:', err);
            setError('Не удалось загрузить пользователей. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const userMatchesSearch = (userData, term) => {
        const searchLower = term.toLowerCase();
        
        // Проверяем различные поля пользователя
        return (
            (userData.username && userData.username.toLowerCase().includes(searchLower)) ||
            (userData.email && userData.email.toLowerCase().includes(searchLower)) ||
            (userData.telegramId && userData.telegramId.toString().includes(searchLower)) ||
            (userData.bio && userData.bio.toLowerCase().includes(searchLower))
        );
    };

    const handleFilterChange = (newFilter) => {
        if (filter !== newFilter) {
            setFilter(newFilter);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(true);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        fetchUsers(true);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            setPage(prevPage => prevPage + 1);
            fetchUsers(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Нет данных';
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        if (!status || status === 'active') {
            return <span className="status-badge active">Активен</span>;
        } else if (status === 'banned') {
            return <span className="status-badge banned">Заблокирован</span>;
        } else if (status === 'suspended') {
            return <span className="status-badge suspended">Приостановлен</span>;
        } else {
            return <span className="status-badge">{status}</span>;
        }
    };

    const handleUserClick = async (userId) => {
        try {
            setLoading(true);
            const userDoc = await getDoc(doc(db, 'users', userId));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setSelectedUser({
                    id: userDoc.id,
                    ...userData,
                    createdAt: userData.createdAt ? (typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate() : userData.createdAt) : null,
                    lastActive: userData.lastActive ? (typeof userData.lastActive.toDate === 'function' ? userData.lastActive.toDate() : userData.lastActive) : null,
                    bannedAt: userData.bannedAt ? (typeof userData.bannedAt.toDate === 'function' ? userData.bannedAt.toDate() : userData.bannedAt) : null
                });
                setUserStatus(userData.status || 'active');
                setStatusNote(userData.statusNote || '');
                setShowUserModal(true);
            } else {
                showToast('Пользователь не найден', 'error');
            }
        } catch (err) {
            console.error('Ошибка при получении данных пользователя:', err);
            showToast('Не удалось загрузить данные пользователя', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseUserModal = () => {
        setShowUserModal(false);
        setSelectedUser(null);
        setUserStatus('');
        setStatusNote('');
    };

    const handleStatusChange = (e) => {
        setUserStatus(e.target.value);
    };

    const handleStatusNoteChange = (e) => {
        setStatusNote(e.target.value);
    };

    const handleUpdateUserStatus = async () => {
        if (!selectedUser) return;
        
        try {
            setIsUpdatingUser(true);
            
            const userRef = doc(db, 'users', selectedUser.id);
            const updateData = {
                status: userStatus,
                statusNote: statusNote
            };
            
            // Если статус изменен на "banned", добавляем дополнительные поля
            if (userStatus === 'banned') {
                updateData.bannedAt = Timestamp.now();
                updateData.bannedBy = user.uid;
            } else if (userStatus === 'active' && selectedUser.status === 'banned') {
                // Если разблокировали пользователя, удаляем информацию о блокировке
                updateData.bannedAt = null;
                updateData.bannedBy = null;
            }
            
            await updateDoc(userRef, updateData);
            
            // Обновляем локальные данные
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === selectedUser.id 
                        ? {...u, status: userStatus, statusNote, bannedAt: userStatus === 'banned' ? new Date() : null} 
                        : u
                )
            );
            
            showToast(`Статус пользователя ${selectedUser.username || 'ID: ' + selectedUser.id} обновлен`, 'success');
            handleCloseUserModal();
            
        } catch (err) {
            console.error('Ошибка при обновлении статуса пользователя:', err);
            showToast('Не удалось обновить статус пользователя', 'error');
        } finally {
            setIsUpdatingUser(false);
        }
    };

    const handleToggleAdmin = async () => {
        if (!selectedUser) return;
        
        try {
            setIsUpdatingUser(true);
            
            const userRef = doc(db, 'users', selectedUser.id);
            const newAdminStatus = !(selectedUser.isAdmin || false);
            
            await updateDoc(userRef, {
                isAdmin: newAdminStatus
            });
            
            // Обновляем локальные данные
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === selectedUser.id 
                        ? {...u, isAdmin: newAdminStatus} 
                        : u
                )
            );
            
            // Обновляем выбранного пользователя
            setSelectedUser({
                ...selectedUser,
                isAdmin: newAdminStatus
            });
            
            showToast(
                `${selectedUser.username || 'Пользователь'} ${newAdminStatus ? 'теперь администратор' : 'больше не администратор'}`, 
                'success'
            );
            
        } catch (err) {
            console.error('Ошибка при изменении прав администратора:', err);
            showToast('Не удалось изменить права администратора', 'error');
        } finally {
            setIsUpdatingUser(false);
        }
    };

    const handleAction = async (userId, action) => {
        try {
            let newStatus;
            switch (action) {
                case 'ban':
                    newStatus = 'banned';
                    break;
                case 'unban':
                    newStatus = 'active';
                    break;
                default:
                    console.error('Unknown action:', action);
                    return;
            }
            await updateUserStatus(userId, newStatus);
        } catch (error) {
            console.error('Error handling action:', error);
            showToast('Произошла ошибка при выполнении действия', 'error');
        }
    };

    return (
        <div className="admin-users-container">
            <div className="admin-users-header">
                <h1>Управление пользователями</h1>
                <button
                    className="admin-back-button"
                    onClick={() => navigate('/admin')}
                >
                    Назад
                </button>
            </div>
            
            <div className="filter-section">
                <div className="filter-buttons">
                    <button 
                        className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        Все
                    </button>
                    <button 
                        className={`filter-button ${filter === 'active' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('active')}
                    >
                        Активные
                    </button>
                    <button 
                        className={`filter-button ${filter === 'banned' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('banned')}
                    >
                        Заблокированные
                    </button>
                    <button 
                        className={`filter-button ${filter === 'admins' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('admins')}
                    >
                        Администраторы
                    </button>
                    <button 
                        className={`filter-button ${filter === 'new' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('new')}
                    >
                        Новые
                    </button>
                </div>
                
                <form className="search-form" onSubmit={handleSearch}>
                    <input 
                        type="text"
                        className="search-input"
                        placeholder="Поиск по имени, email, ID..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                    />
                    <button 
                        type="button" 
                        className="clear-search-button"
                        onClick={handleClearSearch}
                        style={{ visibility: searchTerm ? 'visible' : 'hidden' }}
                    >
                        ✕
                    </button>
                    <button type="submit" className="search-button">Поиск</button>
                </form>
            </div>
            
            {loading && page === 1 && (
                <div className="loading-spinner">Загрузка пользователей...</div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            {!loading && users.length === 0 && (
                <div className="no-users-message">
                    {searchTerm 
                        ? 'Пользователи по запросу не найдены' 
                        : 'Нет пользователей для отображения'}
                </div>
            )}
            
            <div className="users-table">
                <div className="table-header">
                    <div className="cell username-cell">Пользователь</div>
                    <div className="cell id-cell">ID</div>
                    <div className="cell created-cell">Создан</div>
                    <div className="cell activity-cell">Последняя активность</div>
                    <div className="cell status-cell">Статус</div>
                </div>
                
                <div className="table-body">
                    {users.map(user => (
                        <div 
                            key={user.id} 
                            className="table-row"
                            onClick={() => handleUserClick(user.id)}
                        >
                            <div className="cell username-cell">
                                <div className="user-avatar">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.username || 'User'} />
                                    ) : (
                                        <div className="default-avatar">
                                            {(user.username || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="user-info">
                                    <div className="username">
                                        {user.username || 'Нет имени'}
                                        {user.isAdmin && <span className="admin-badge">Админ</span>}
                                    </div>
                                    <div className="email">{user.email || 'Нет email'}</div>
                                </div>
                            </div>
                            <div className="cell id-cell">
                                {user.telegramId || user.id.substring(0, 8)}
                            </div>
                            <div className="cell created-cell">
                                {formatDate(user.createdAt)}
                            </div>
                            <div className="cell activity-cell">
                                {formatDate(user.lastActive)}
                            </div>
                            <div className="cell status-cell">
                                {getStatusBadge(user.status)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {loading && page > 1 && (
                <div className="loading-more">Загрузка дополнительных пользователей...</div>
            )}
            
            {hasMore && !loading && (
                <button className="load-more-button" onClick={handleLoadMore}>
                    Загрузить ещё
                </button>
            )}
            
            {selectedUser && showUserModal && (
                <div className="user-modal-overlay">
                    <div className="user-modal">
                        <div className="user-modal-header">
                            <h2>Управление пользователем</h2>
                            <button className="close-button" onClick={handleCloseUserModal}>×</button>
                        </div>
                        
                        <div className="user-modal-content">
                            <div className="user-profile">
                                <div className="user-avatar large">
                                    {selectedUser.photoURL ? (
                                        <img src={selectedUser.photoURL} alt={selectedUser.username || 'User'} />
                                    ) : (
                                        <div className="default-avatar large">
                                            {(selectedUser.username || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="user-details">
                                    <h3 className="user-name">
                                        {selectedUser.username || 'Без имени'}
                                        {selectedUser.isAdmin && (
                                            <span className="admin-badge">Администратор</span>
                                        )}
                                    </h3>
                                    
                                    <div className="user-detail">
                                        <span className="detail-label">ID:</span> 
                                        <span className="detail-value">{selectedUser.id}</span>
                                    </div>
                                    
                                    {selectedUser.telegramId && (
                                        <div className="user-detail">
                                            <span className="detail-label">Telegram ID:</span> 
                                            <span className="detail-value">{selectedUser.telegramId}</span>
                                        </div>
                                    )}
                                    
                                    {selectedUser.email && (
                                        <div className="user-detail">
                                            <span className="detail-label">Email:</span> 
                                            <span className="detail-value">{selectedUser.email}</span>
                                        </div>
                                    )}
                                    
                                    <div className="user-detail">
                                        <span className="detail-label">Создан:</span> 
                                        <span className="detail-value">{formatDate(selectedUser.createdAt)}</span>
                                    </div>
                                    
                                    <div className="user-detail">
                                        <span className="detail-label">Последняя активность:</span> 
                                        <span className="detail-value">{formatDate(selectedUser.lastActive)}</span>
                                    </div>
                                    
                                    {selectedUser.status === 'banned' && selectedUser.bannedAt && (
                                        <div className="user-detail">
                                            <span className="detail-label">Заблокирован:</span> 
                                            <span className="detail-value">{formatDate(selectedUser.bannedAt)}</span>
                                        </div>
                                    )}
                                    
                                    {selectedUser.bio && (
                                        <div className="user-bio">
                                            <span className="detail-label">О себе:</span>
                                            <p className="bio-text">{selectedUser.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="user-actions">
                                <div className="status-section">
                                    <h4>Изменить статус</h4>
                                    <div className="status-inputs">
                                        <div className="status-select-group">
                                            <label>Статус:</label>
                                            <select 
                                                value={userStatus} 
                                                onChange={handleStatusChange}
                                                disabled={isUpdatingUser}
                                            >
                                                <option value="active">Активен</option>
                                                <option value="banned">Заблокирован</option>
                                                <option value="suspended">Приостановлен</option>
                                            </select>
                                        </div>
                                        
                                        <div className="status-note-group">
                                            <label>Примечание:</label>
                                            <textarea 
                                                value={statusNote}
                                                onChange={handleStatusNoteChange}
                                                placeholder="Причина изменения статуса..."
                                                disabled={isUpdatingUser}
                                            />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className="update-status-button"
                                        onClick={handleUpdateUserStatus}
                                        disabled={isUpdatingUser}
                                    >
                                        {isUpdatingUser ? 'Сохранение...' : 'Сохранить статус'}
                                    </button>
                                </div>
                                
                                <div className="admin-toggle-section">
                                    <h4>Права администратора</h4>
                                    <p className="admin-status">
                                        Текущий статус: <strong>{selectedUser.isAdmin ? 'Администратор' : 'Обычный пользователь'}</strong>
                                    </p>
                                    <button 
                                        className={`toggle-admin-button ${selectedUser.isAdmin ? 'remove' : 'add'}`}
                                        onClick={handleToggleAdmin}
                                        disabled={isUpdatingUser}
                                    >
                                        {selectedUser.isAdmin 
                                            ? 'Убрать права администратора' 
                                            : 'Назначить администратором'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers; 