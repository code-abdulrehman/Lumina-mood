import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Icons from 'lucide-react-native';
import { format } from 'date-fns';
import { MoodEntry } from '../types/mood';
import { MOOD_CONFIGS } from '../data/moods';

interface MoodRowProps {
    mood: MoodEntry;
    onPress?: () => void;
}

export const MoodRow: React.FC<MoodRowProps> = ({ mood, onPress }) => {
    const config = MOOD_CONFIGS.find(c => c.level === mood.level);
    const IconComponent = (Icons as any)[mood.iconName] || Icons.HelpCircle;

    const lastMessage = mood.chatHistory && mood.chatHistory.length > 0
        ? mood.chatHistory.filter(m => m.role === 'model').slice(-1)[0]?.text
        : "No conversation yet";

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={styles.container}
        >
            <View style={[styles.iconContainer, { backgroundColor: config?.color || '#eee' }]}>
                <IconComponent size={20} color="#fff" />
            </View>
            <View style={styles.textContainer}>
                <View style={styles.rowHeader}>
                    <Text style={styles.label}>{mood.label}</Text>
                    <Text style={styles.time}>{format(mood.timestamp, 'h:mm a')}</Text>
                </View>
                <Text style={styles.chatSnippet} numberOfLines={1}>
                    {lastMessage}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textContainer: {
        flex: 1,
    },
    rowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    label: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    time: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    chatSnippet: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
});
