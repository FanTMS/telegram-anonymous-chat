import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/dbService';

// ...existing code...

export const useSessionData = () => {
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const userData = await getItem('sessions.current');
                setSessionData(userData);
            } catch (error) {
                console.error('Failed to load session data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionData();
    }, []);

    const updateSessionData = async (newData) => {
        try {
            await setItem('sessions.current', newData);
            setSessionData(newData);
        } catch (error) {
            console.error('Failed to update session data:', error);
        }
    };

    return { sessionData, loading, updateSessionData };
};

// ...existing code...
