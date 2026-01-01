import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry, UserSettings } from '../types/mood';

const MOODS_KEY = '@lumina_moods';
const SETTINGS_KEY = '@lumina_settings';

export const saveMood = async (mood: MoodEntry) => {
    try {
        const existingMoods = await getMoods();
        const updatedMoods = [mood, ...existingMoods];
        await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(updatedMoods));
    } catch (error) {
        console.error('Error saving mood:', error);
    }
};

export const updateMood = async (moodId: string, updates: Partial<MoodEntry>) => {
    try {
        const existingMoods = await getMoods();
        const updatedMoods = existingMoods.map(m =>
            m.id === moodId ? { ...m, ...updates } : m
        );
        await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(updatedMoods));
    } catch (error) {
        console.error('Error updating mood:', error);
    }
};

export const getMoods = async (): Promise<MoodEntry[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(MOODS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
        console.error('Error getting moods:', error);
        return [];
    }
};

export const clearAllData = async () => {
    try {
        await Promise.all([
            AsyncStorage.removeItem(MOODS_KEY),
            AsyncStorage.removeItem(SETTINGS_KEY)
        ]);
    } catch (error) {
        console.error('Error clearing data:', error);
    }
};

export const saveSettings = async (settings: UserSettings) => {
    try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
};

export const getSettings = async (): Promise<UserSettings | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error getting settings:', error);
        return null;
    }
};

export const deleteMood = async (moodId: string) => {
    try {
        const existingMoods = await getMoods();
        const updatedMoods = existingMoods.filter(m => m.id !== moodId);
        await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(updatedMoods));
    } catch (error) {
        console.error('Error deleting mood:', error);
    }
};
