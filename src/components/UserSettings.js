import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/dbService';

// ...existing code...

export const useUserSettings = (userId) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            if (!userId) return;

            try {
                const userSettings = await getItem(`settings.${userId}`);
                setSettings(userSettings || {});
            } catch (error) {
                console.error('Failed to load user settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [userId]);

    const updateSettings = async (newSettings) => {
        if (!userId) return;

        try {
            const updatedSettings = { ...settings, ...newSettings };
            await setItem(`settings.${userId}`, updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    return { settings, loading, updateSettings };
};

// ...existing code...
