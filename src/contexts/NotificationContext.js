import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext({
  unreadChatsCount: 0,
  unreadChats: []
});

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    
    console.log("Setting up notification listener for user:", user.uid);

    // Query to find all chats where the user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let count = 0;
      const unreadChatIds = [];

      snapshot.docs.forEach((doc) => {
        const chatData = doc.data();
        
        // Check if chat is unread using various mechanisms:
        // 1. Direct unreadByUser flag
        // 2. The user-specific entry in unreadBy object
        // 3. For support chats, specific support chat unread indicator
        const isUnread = 
          chatData.unreadByUser === true || 
          (chatData.unreadBy && chatData.unreadBy[user.uid] === true) ||
          (chatData.type === 'support' && chatData.unreadByUser === true);
        
        if (isUnread) {
          count++;
          unreadChatIds.push(doc.id);
          console.log("Found unread chat:", doc.id, chatData);
        }
      });

      console.log("Unread chats count:", count, "Unread chat IDs:", unreadChatIds);
      setUnreadChatsCount(count);
      setUnreadChats(unreadChatIds);
    });

    return () => unsubscribe();
  }, [user]);

  const value = {
    unreadChatsCount,
    unreadChats,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 