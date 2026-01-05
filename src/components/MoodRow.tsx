import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { format } from 'date-fns';
import { MoodEntry } from '../types/mood';
import { MOOD_CONFIGS } from '../data/moods';
import MoodIcon from './MoodIcon';
import { useMood } from '../context/MoodContext';
import { Card } from './common/Card';

interface MoodRowProps {
    mood: MoodEntry;
    onPress?: () => void;
}

export const MoodRow: React.FC<MoodRowProps> = ({ mood, onPress }) => {
    const { theme } = useMood();
    const config = MOOD_CONFIGS.find(c => c.level === mood.level);

    const lastMessage = mood.chatHistory && mood.chatHistory.length > 0
        ? mood.chatHistory.filter(m => m.role === 'model').slice(-1)[0]?.text
        : "No conversation yet";

    return (
        <Card onPress={onPress} padding="small" style={styles.cardSpacing}>
            <View style={styles.contentContainer}>
                <View style={[styles.iconContainer,
                Platform.OS !== 'android' ?
                    { backgroundColor: config?.color || '#eee', }
                    :
                    {
                        overflow: 'hidden',
                        shadowColor: config?.color || '#eee',
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 16,
                    }]}>
                    <MoodIcon
                        iconName={mood.iconName}
                        size={Platform.OS !== 'android' ? 28 : 36}
                        color="#fff"
                        customImage={config?.customImage}
                    />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.rowHeader}>
                        <Text style={[styles.label, { color: theme.text }]}>{mood.label}</Text>
                        <Text style={[styles.time, { color: theme.textSecondary }]}>{format(mood.timestamp, 'h:mm a')}</Text>
                    </View>
                    <Text style={[styles.chatSnippet, { color: theme.textSecondary }]} numberOfLines={1}>
                        {lastMessage}
                    </Text>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    cardSpacing: {
        marginBottom: 8,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
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
        fontSize: 14,
        fontWeight: '800',
    },
    time: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    chatSnippet: {
        fontSize: 10,
        fontWeight: '500',
    },
});
