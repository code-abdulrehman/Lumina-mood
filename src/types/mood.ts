export type MoodLevel = 'awesome' | 'great' | 'good' | 'neutral' | 'down' | 'unhappy' | 'awful' | 'loved' | 'blessed' | 'joyful' | 'angry' | 'scared' | 'confused' | 'hot' | 'hugging' | 'woozy';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface MoodEntry {
    id: string;
    level: MoodLevel;
    iconName: string;
    label: string;
    timestamp: number; // Date.now()
    chatHistory?: ChatMessage[];
    chatSummary?: string;
}

export interface UserSettings {
    apiKey: string;
    primaryColor?: string;
}

export interface MoodConfig {
    level: MoodLevel;
    icon: string;
    label: string;
    color: string;
    customImage?: string | number;
}

export interface Insight {
    title: string;
    description: string;
    type: 'pattern' | 'frequency' | 'time';
    moodLevel?: MoodLevel;
    topMoods?: MoodLevel[];
}
