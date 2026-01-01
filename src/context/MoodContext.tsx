import React, { createContext, useContext, useState, useEffect } from 'react';
import { MoodEntry, UserSettings } from '../types/mood';
import * as storage from '../utils/storage';
import { Alert } from 'react-native';

export interface Theme {
    primary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    radius: number;
    radiusLarge: number;
    glassBackground: string;
    glassBorder: string;
    darkGlass: string;
}

interface MoodContextType {
    moods: MoodEntry[];
    addMood: (level: string, iconName: string, label: string) => Promise<MoodEntry | null>;
    updateMoodEntry: (moodId: string, updates: Partial<MoodEntry>) => Promise<void>;
    deleteMoodEntry: (moodId: string) => Promise<void>;
    refreshMoods: () => Promise<void>;
    clearAllData: () => Promise<void>;
    isLoading: boolean;
    apiKey: string | null;
    updateApiKey: (key: string) => Promise<void>;
    primaryColor: string;
    updatePrimaryColor: (color: string) => Promise<void>;
    theme: Theme;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [moods, setMoods] = useState<MoodEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#6366F1');

    const theme: Theme = {
        primary: primaryColor,
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        radius: 16,
        radiusLarge: 28,
        glassBackground: 'rgba(255, 255, 255, 0.7)',
        glassBorder: 'rgba(255, 255, 255, 0.3)',
        darkGlass: 'rgba(15, 23, 42, 0.05)',
    };

    const loadData = async () => {
        setIsLoading(true);
        const [storedMoods, storedSettings] = await Promise.all([
            storage.getMoods(),
            storage.getSettings()
        ]);
        setMoods(storedMoods || []);
        if (storedSettings) {
            if (storedSettings.apiKey) setApiKey(storedSettings.apiKey);
            if (storedSettings.primaryColor) setPrimaryColor(storedSettings.primaryColor);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateApiKey = async (key: string) => {
        const settings = await storage.getSettings() || { apiKey: '' };
        const updated = { ...settings, apiKey: key };
        await storage.saveSettings(updated);
        setApiKey(key);
    };

    const updatePrimaryColor = async (color: string) => {
        const settings = await storage.getSettings() || { apiKey: apiKey || '' };
        const updated = { ...settings, primaryColor: color };
        await storage.saveSettings(updated);
        setPrimaryColor(color);
    };

    const clearAllData = async () => {
        await storage.clearAllData();
        setMoods([]);
        setApiKey(null);
        setPrimaryColor('#6366F1');
    };

    const addMood = async (level: any, iconName: string, label: string) => {
        const today = new Date().setHours(0, 0, 0, 0);

        const existingEntry = moods.find(m => {
            const mDate = new Date(m.timestamp).setHours(0, 0, 0, 0);
            return mDate === today && m.label === label;
        });

        if (existingEntry) {
            return existingEntry;
        }

        const todaysEntries = moods.filter(m => {
            const mDate = new Date(m.timestamp).setHours(0, 0, 0, 0);
            return mDate === today;
        });

        if (todaysEntries.length >= 5) {
            Alert.alert("Limit Reached", "You can only track 5 different moods per day.");
            return null;
        }

        const newMood: MoodEntry = {
            id: Math.random().toString(36).substring(7),
            level,
            iconName,
            label,
            timestamp: Date.now(),
        };
        await storage.saveMood(newMood);
        setMoods(prev => [newMood, ...prev]);
        return newMood;
    };

    const updateMoodEntry = async (moodId: string, updates: Partial<MoodEntry>) => {
        await storage.updateMood(moodId, updates);
        setMoods(prev => prev.map(m => m.id === moodId ? { ...m, ...updates } : m));
    };

    const deleteMoodEntry = async (moodId: string) => {
        await storage.deleteMood(moodId);
        setMoods(prev => prev.filter(m => m.id !== moodId));
    };

    return (
        <MoodContext.Provider value={{
            moods,
            addMood,
            updateMoodEntry,
            deleteMoodEntry,
            refreshMoods: loadData,
            clearAllData,
            isLoading,
            apiKey,
            updateApiKey,
            primaryColor,
            updatePrimaryColor,
            theme
        }}>
            {children}
        </MoodContext.Provider>
    );
};

export const useMood = () => {
    const context = useContext(MoodContext);
    if (!context) throw new Error('useMood must be used within a MoodProvider');
    return context;
};
