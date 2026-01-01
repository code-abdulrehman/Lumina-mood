export type MoodLevel = 'great' | 'good' | 'neutral' | 'down' | 'unhappy';

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
}

export interface Insight {
    title: string;
    description: string;
    type: 'pattern' | 'frequency' | 'time';
}
