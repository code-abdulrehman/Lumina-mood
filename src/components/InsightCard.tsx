import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Calendar } from 'lucide-react-native';
import { Insight } from '../types/mood';
import { useMood } from '../context/MoodContext';
import { format } from 'date-fns';

interface InsightCardProps {
    insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
    const { theme, primaryColor } = useMood();
    const today = format(new Date(), 'MMM d, yyyy');

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.glow} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: primaryColor + '15' }]}>
                        <Sparkles size={18} color={primaryColor} />
                    </View>
                    <View style={styles.titleArea}>
                        <Text style={[styles.title, { color: theme.text }]}>{insight.title}</Text>
                        <View style={styles.dateRow}>
                            <Calendar size={10} color={theme.textSecondary} />
                            <Text style={[styles.dateText, { color: theme.textSecondary }]}>REPORT • {today}</Text>
                        </View>
                    </View>
                </View>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{insight.description}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 2,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        transform: [{ scale: 2 }],
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleArea: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    dateText: {
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
});
