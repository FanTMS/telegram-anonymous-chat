import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, arrayRemove, getDoc, orderBy } from 'firebase/firestore';
import { useToast } from '../components/Toast';
import '../styles/Friends.css';

const Friends = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('friends');
    
    useEffect(() => {
        if (!user?.uid) return;
        
        // Subscribe to friends list and their status
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, async (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const friendsList = userData.friends || [];
                const friendRequestsList = userData.friendRequests || [];
                
                // Fetch friend details
                if (friendsList.length > 0) {
                    const friendsQuery = query(
                        collection(db, 'users'),
                        where('uid', 'in', friendsList)
                    );
                    const friendsSnapshot = await getDocs(friendsQuery);
                    const friendsData = friendsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        lastActive: doc.data().lastActive?.toDate?.() || null
                    }));
                    setFriends(friendsData);
                } else {
                    setFriends([]);
                }
                
                // Fetch friend request details
                if (friendRequestsList.length > 0) {
                    const requestsQuery = query(
                        collection(db, 'users'),
                        where('uid', 'in', friendRequestsList)
                    );
                    const requestsSnapshot = await getDocs(requestsQuery);
                    const requestsData = requestsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        lastActive: doc.data().lastActive?.toDate?.() || null
                    }));
                    setFriendRequests(requestsData);
                } else {
                    setFriendRequests([]);
                }
                
                setLoading(false);
            }
        });
        
        return () => unsubscribe();
    }, [user?.uid]);
    
    const handleAcceptRequest = async (friendId) => {
        try {
            if (!user?.uid) return;
            
            // Add to current user's friends list
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                friends: arrayUnion(friendId),
                friendRequests: arrayRemove(friendId)
            });
            
            // Add current user to friend's friends list
            const friendRef = doc(db, 'users', friendId);
            await updateDoc(friendRef, {
                friends: arrayUnion(user.uid)
            });
            
            showToast('Запрос принят!', 'success');
        } catch (error) {
            console.error('Error accepting friend request:', error);
            showToast('Ошибка при принятии запроса', 'error');
        }
    };
    
    const handleRejectRequest = async (friendId) => {
        try {
            if (!user?.uid) return;
            
            // Remove from current user's friend requests
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                friendRequests: arrayRemove(friendId)
            });
            
            showToast('Запрос отклонен', 'info');
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            showToast('Ошибка при отклонении запроса', 'error');
        }
    };
    
    const handleRemoveFriend = async (friendId) => {
        try {
            if (!user?.uid) return;
            
            // Remove from current user's friends list
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                friends: arrayRemove(friendId)
            });
            
            // Remove current user from friend's friends list
            const friendRef = doc(db, 'users', friendId);
            await updateDoc(friendRef, {
                friends: arrayRemove(user.uid)
            });
            
            showToast('Друг удален', 'info');
        } catch (error) {
            console.error('Error removing friend:', error);
            showToast('Ошибка при удалении друга', 'error');
        }
    };
    
    const handleStartChat = async (friendId) => {
        try {
            // Check if chat already exists
            const chatsQuery = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', user.uid)
            );
            
            const chatsSnapshot = await getDocs(chatsQuery);
            let existingChat = null;
            
            chatsSnapshot.forEach(doc => {
                const chatData = doc.data();
                if (chatData.participants.includes(friendId)) {
                    existingChat = {
                        id: doc.id,
                        ...chatData
                    };
                }
            });
            
            if (existingChat) {
                // Navigate to existing chat
                navigate(`/chat/${existingChat.id}`);
            } else {
                // Create new chat
                const chatData = {
                    participants: [user.uid, friendId],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    lastMessage: null,
                    messagesCount: 0,
                    isFriendChat: true,
                    participantsNotified: {
                        [user.uid]: true,
                        [friendId]: true
                    }
                };
                
                // Add participant data
                const userData = await getDoc(doc(db, 'users', user.uid));
                const friendData = await getDoc(doc(db, 'users', friendId));
                
                if (userData.exists() && friendData.exists()) {
                    chatData.participantsData = {
                        [user.uid]: {
                            name: userData.data().name || 'Пользователь',
                            userColor: userData.data().userColor || '#' + Math.floor(Math.random()*16777215).toString(16)
                        },
                        [friendId]: {
                            name: friendData.data().name || 'Друг',
                            userColor: friendData.data().userColor || '#' + Math.floor(Math.random()*16777215).toString(16)
                        }
                    };
                }
                
                const newChatRef = await addDoc(collection(db, 'chats'), chatData);
                
                // Navigate to new chat
                navigate(`/chat/${newChatRef.id}`);
            }
        } catch (error) {
            console.error('Error starting chat with friend:', error);
            showToast('Не удалось начать чат', 'error');
        }
    };
    
    // Helper function to format last active time
    const formatLastActive = (lastActive) => {
        if (!lastActive) return 'Не в сети';
        
        const now = new Date();
        const diff = now - lastActive;
        
        // If online in the last 5 minutes
        if (diff < 5 * 60 * 1000) {
            return 'В сети';
        }
        
        // If today
        if (lastActive.toDateString() === now.toDateString()) {
            return `Был(а) в ${lastActive.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
        
        // If yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive.toDateString() === yesterday.toDateString()) {
            return `Вчера в ${lastActive.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
        
        // Otherwise show date
        return `${lastActive.toLocaleDateString()}`;
    };
    
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }
    
    return (
        <div className="friends-container">
            <div className="friends-tabs">
                <div 
                    className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Друзья {friends.length > 0 && <span>({friends.length})</span>}
                </div>
                <div 
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Запросы {friendRequests.length > 0 && <span className="request-badge">({friendRequests.length})</span>}
                </div>
            </div>
            
            <div className="friends-list">
                {activeTab === 'friends' ? (
                    <>
                        {friends.length > 0 ? (
                            friends.map((friend) => (
                                <div key={friend.id} className="friend-item">
                                    <div className="friend-avatar">
                                        {friend.photoURL ? (
                                            <img src={friend.photoURL} alt={friend.name} />
                                        ) : (
                                            <div className="avatar-initials">
                                                {friend.name ? friend.name.substring(0, 2).toUpperCase() : 'UN'}
                                            </div>
                                        )}
                                        <div className={`status-indicator ${formatLastActive(friend.lastActive) === 'В сети' ? 'online' : 'offline'}`}></div>
                                    </div>
                                    <div className="friend-info">
                                        <h3>{friend.name || 'Пользователь'}</h3>
                                        <p>{formatLastActive(friend.lastActive)}</p>
                                    </div>
                                    <div className="friend-actions">
                                        <button 
                                            className="action-btn chat-btn"
                                            onClick={() => handleStartChat(friend.id)}
                                        >
                                            <i className="fas fa-comment"></i>
                                        </button>
                                        <button 
                                            className="action-btn remove-btn"
                                            onClick={() => handleRemoveFriend(friend.id)}
                                        >
                                            <i className="fas fa-user-times"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-user-friends"></i>
                                <p>У вас пока нет друзей</p>
                                <small>Здесь будут отображаться пользователи, которых вы добавили в друзья</small>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {friendRequests.length > 0 ? (
                            friendRequests.map((request) => (
                                <div key={request.id} className="friend-request-item">
                                    <div className="friend-avatar">
                                        {request.photoURL ? (
                                            <img src={request.photoURL} alt={request.name} />
                                        ) : (
                                            <div className="avatar-initials">
                                                {request.name ? request.name.substring(0, 2).toUpperCase() : 'UN'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="friend-info">
                                        <h3>{request.name || 'Пользователь'}</h3>
                                        <p>Хочет добавить вас в друзья</p>
                                    </div>
                                    <div className="request-actions">
                                        <button 
                                            className="action-btn accept-btn"
                                            onClick={() => handleAcceptRequest(request.id)}
                                        >
                                            <i className="fas fa-check"></i>
                                        </button>
                                        <button 
                                            className="action-btn reject-btn"
                                            onClick={() => handleRejectRequest(request.id)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <p>Нет запросов в друзья</p>
                                <small>Здесь будут отображаться запросы в друзья от других пользователей</small>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Friends; 