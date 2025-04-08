import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    arrayUnion, 
    arrayRemove,
    onSnapshot
} from 'firebase/firestore';
import { useTelegram } from '../hooks/useTelegram';
import '../styles/Friends.css';

const Friends = () => {
    const { user, isAuthenticated } = useAuth();
    const { hapticFeedback } = useTelegram();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Загрузка данных друзей и запросов
    useEffect(() => {
        if (!isAuthenticated || !user || !user.id) {
            setLoading(false);
            return;
        }
        
        const loadFriendsData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Получаем документ пользователя
                const userRef = doc(db, 'users', user.id);
                const userDoc = await getDoc(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error('Пользователь не найден');
                }
                
                const userData = userDoc.data();
                
                // Получаем списки из данных пользователя
                const friendsList = userData.friends || [];
                const requestsList = userData.friendRequests || [];
                const sentList = userData.sentFriendRequests || [];
                
                // Загружаем данные друзей
                const friendsData = await Promise.all(
                    friendsList.map(async (friendId) => {
                        try {
                            const friendDoc = await getDoc(doc(db, 'users', friendId));
                            if (friendDoc.exists()) {
                                return {
                                    id: friendDoc.id,
                                    ...friendDoc.data()
                                };
                            }
                            return null;
                        } catch (e) {
                            console.error(`Ошибка при загрузке друга ${friendId}:`, e);
                            return null;
                        }
                    })
                );
                
                // Загружаем данные входящих запросов
                const requestsData = await Promise.all(
                    requestsList.map(async (requesterId) => {
                        try {
                            const requesterDoc = await getDoc(doc(db, 'users', requesterId));
                            if (requesterDoc.exists()) {
                                return {
                                    id: requesterDoc.id,
                                    ...requesterDoc.data()
                                };
                            }
                            return null;
                        } catch (e) {
                            console.error(`Ошибка при загрузке запроса ${requesterId}:`, e);
                            return null;
                        }
                    })
                );
                
                // Загружаем данные исходящих запросов
                const sentData = await Promise.all(
                    sentList.map(async (targetId) => {
                        try {
                            const targetDoc = await getDoc(doc(db, 'users', targetId));
                            if (targetDoc.exists()) {
                                return {
                                    id: targetDoc.id,
                                    ...targetDoc.data()
                                };
                            }
                            return null;
                        } catch (e) {
                            console.error(`Ошибка при загрузке исходящего запроса ${targetId}:`, e);
                            return null;
                        }
                    })
                );
                
                // Фильтруем null-значения и устанавливаем состояния
                setFriends(friendsData.filter(Boolean));
                setFriendRequests(requestsData.filter(Boolean));
                setSentRequests(sentData.filter(Boolean));
            } catch (err) {
                console.error('Ошибка при загрузке данных друзей:', err);
                setError('Не удалось загрузить список друзей. Пожалуйста, попробуйте позже.');
            } finally {
                setLoading(false);
            }
        };
        
        loadFriendsData();
        
        // Создаем подписку на обновления
        const unsubscribe = onSnapshot(doc(db, 'users', user.id), (doc) => {
            if (doc.exists()) {
                loadFriendsData();
            }
        }, (err) => {
            console.error('Ошибка при подписке на обновления:', err);
        });
        
        return () => unsubscribe();
    }, [user, isAuthenticated]);
    
    // Обработчики действий с друзьями
    const handleAcceptRequest = async (requesterId) => {
        try {
            // Тактильная обратная связь
            if (hapticFeedback) hapticFeedback('impact', 'light');
            
            const userRef = doc(db, 'users', user.id);
            const requesterRef = doc(db, 'users', requesterId);
            
            // Обновляем документ текущего пользователя
            await updateDoc(userRef, {
                friends: arrayUnion(requesterId),
                friendRequests: arrayRemove(requesterId)
            });
            
            // Обновляем документ отправителя запроса
            await updateDoc(requesterRef, {
                friends: arrayUnion(user.id),
                sentFriendRequests: arrayRemove(user.id)
            });
            
            // Обновляем локальный список друзей
            setFriends(prev => [...prev, friendRequests.find(r => r.id === requesterId)]);
            setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
        } catch (err) {
            console.error('Ошибка при принятии запроса в друзья:', err);
            setError('Не удалось принять запрос. Пожалуйста, попробуйте позже.');
        }
    };
    
    const handleRejectRequest = async (requesterId) => {
        try {
            // Тактильная обратная связь
            if (hapticFeedback) hapticFeedback('impact', 'medium');
            
            const userRef = doc(db, 'users', user.id);
            const requesterRef = doc(db, 'users', requesterId);
            
            // Обновляем документ текущего пользователя
            await updateDoc(userRef, {
                friendRequests: arrayRemove(requesterId)
            });
            
            // Обновляем документ отправителя запроса
            await updateDoc(requesterRef, {
                sentFriendRequests: arrayRemove(user.id)
            });
            
            // Обновляем локальный список запросов
            setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
        } catch (err) {
            console.error('Ошибка при отклонении запроса в друзья:', err);
            setError('Не удалось отклонить запрос. Пожалуйста, попробуйте позже.');
        }
    };
    
    const handleCancelRequest = async (targetId) => {
        try {
            // Тактильная обратная связь
            if (hapticFeedback) hapticFeedback('impact', 'medium');
            
            const userRef = doc(db, 'users', user.id);
            const targetRef = doc(db, 'users', targetId);
            
            // Обновляем документ текущего пользователя
            await updateDoc(userRef, {
                sentFriendRequests: arrayRemove(targetId)
            });
            
            // Обновляем документ получателя запроса
            await updateDoc(targetRef, {
                friendRequests: arrayRemove(user.id)
            });
            
            // Обновляем локальный список исходящих запросов
            setSentRequests(prev => prev.filter(r => r.id !== targetId));
        } catch (err) {
            console.error('Ошибка при отмене запроса в друзья:', err);
            setError('Не удалось отменить запрос. Пожалуйста, попробуйте позже.');
        }
    };
    
    const handleRemoveFriend = async (friendId) => {
        try {
            // Тактильная обратная связь
            if (hapticFeedback) hapticFeedback('impact', 'heavy');
            
            const userRef = doc(db, 'users', user.id);
            const friendRef = doc(db, 'users', friendId);
            
            // Обновляем документ текущего пользователя
            await updateDoc(userRef, {
                friends: arrayRemove(friendId)
            });
            
            // Обновляем документ друга
            await updateDoc(friendRef, {
                friends: arrayRemove(user.id)
            });
            
            // Обновляем локальный список друзей
            setFriends(prev => prev.filter(f => f.id !== friendId));
        } catch (err) {
            console.error('Ошибка при удалении друга:', err);
            setError('Не удалось удалить друга. Пожалуйста, попробуйте позже.');
        }
    };
    
    // Функция форматирования имени пользователя
    const formatUserName = (user) => {
        if (!user) return 'Неизвестный пользователь';
        
        if (user.name) {
            return user.name;
        }
        
        if (user.telegramData) {
            const tgData = user.telegramData;
            if (tgData.firstName || tgData.lastName) {
                return [tgData.firstName, tgData.lastName].filter(Boolean).join(' ');
            }
            if (tgData.username) {
                return `@${tgData.username}`;
            }
        }
        
        return 'Пользователь';
    };
    
    // Обработчик нажатия на карточку пользователя
    const handleUserClick = (userId) => {
        if (hapticFeedback) hapticFeedback('selection');
        navigate(`/user/${userId}`);
    };
    
    return (
        <div className="friends-container">
            <h1 className="friends-title">Друзья</h1>
            
            {error && <div className="friends-error">{error}</div>}
            
            <div className="friends-tabs">
                <button 
                    className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Друзья 
                    {friends.length > 0 && <span className="tab-count">{friends.length}</span>}
                </button>
                <button 
                    className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Входящие 
                    {friendRequests.length > 0 && <span className="tab-count">{friendRequests.length}</span>}
                </button>
                <button 
                    className={`tab-button ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    Отправленные 
                    {sentRequests.length > 0 && <span className="tab-count">{sentRequests.length}</span>}
                </button>
            </div>
            
            <div className="friends-content">
                {loading ? (
                    <div className="friends-loading">
                        <div className="loading-spinner"></div>
                        <p>Загрузка...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'friends' && (
                            <div className="friends-list">
                                {friends.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">👋</div>
                                        <p>У вас пока нет друзей</p>
                                    </div>
                                ) : (
                                    friends.map(friend => (
                                        <div key={friend.id} className="friend-card">
                                            <div 
                                                className="friend-info" 
                                                onClick={() => handleUserClick(friend.id)}
                                            >
                                                <div className="friend-avatar">
                                                    {friend.photoURL ? (
                                                        <img src={friend.photoURL} alt={formatUserName(friend)} />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {formatUserName(friend).substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="friend-details">
                                                    <h3>{formatUserName(friend)}</h3>
                                                    <p>{friend.status || (friend.isOnline ? 'В сети' : 'Не в сети')}</p>
                                                </div>
                                            </div>
                                            <button 
                                                className="friend-action-btn remove" 
                                                onClick={() => handleRemoveFriend(friend.id)}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'requests' && (
                            <div className="friends-list">
                                {friendRequests.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📩</div>
                                        <p>У вас нет входящих запросов в друзья</p>
                                    </div>
                                ) : (
                                    friendRequests.map(request => (
                                        <div key={request.id} className="friend-card">
                                            <div 
                                                className="friend-info" 
                                                onClick={() => handleUserClick(request.id)}
                                            >
                                                <div className="friend-avatar">
                                                    {request.photoURL ? (
                                                        <img src={request.photoURL} alt={formatUserName(request)} />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {formatUserName(request).substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="friend-details">
                                                    <h3>{formatUserName(request)}</h3>
                                                    <p>Хочет добавить вас в друзья</p>
                                                </div>
                                            </div>
                                            <div className="friend-actions">
                                                <button 
                                                    className="friend-action-btn accept" 
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                >
                                                    Принять
                                                </button>
                                                <button 
                                                    className="friend-action-btn reject" 
                                                    onClick={() => handleRejectRequest(request.id)}
                                                >
                                                    Отклонить
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'sent' && (
                            <div className="friends-list">
                                {sentRequests.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔎</div>
                                        <p>Вы не отправили запросов в друзья</p>
                                    </div>
                                ) : (
                                    sentRequests.map(sent => (
                                        <div key={sent.id} className="friend-card">
                                            <div 
                                                className="friend-info" 
                                                onClick={() => handleUserClick(sent.id)}
                                            >
                                                <div className="friend-avatar">
                                                    {sent.photoURL ? (
                                                        <img src={sent.photoURL} alt={formatUserName(sent)} />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {formatUserName(sent).substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="friend-details">
                                                    <h3>{formatUserName(sent)}</h3>
                                                    <p>Ожидает подтверждения</p>
                                                </div>
                                            </div>
                                            <button 
                                                className="friend-action-btn cancel" 
                                                onClick={() => handleCancelRequest(sent.id)}
                                            >
                                                Отменить
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Friends; 