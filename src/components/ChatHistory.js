import React, { useState, useEffect } from 'react';
import { getAllItems, setItem } from '../utils/dbService';

// ...existing code...

export const useChatHistory = (userId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMessages = async () => {
            if (!userId) return;

            try {
                const chatData = await getAllItems('messages', { userId });
                setMessages(chatData || []);
            } catch (error) {
                console.error('Failed to load chat history:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, [userId]);

    const addMessage = async (message) => {
        if (!userId) return;

        const newMessage = {
            ...message,
            userId,
            timestamp: new Date().toISOString(),
            _id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        try {
            await setItem(`messages.${newMessage._id}`, newMessage);
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    };

    return { messages, loading, addMessage };
};

// ...existing code...
