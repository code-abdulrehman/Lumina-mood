import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Calendar } from 'lucide-react-native';
import { Insight } from '../types/mood';
import { useMood } from '../context/MoodContext';
import { format } from 'date-fns';
import { MOOD_CONFIGS } from '../data/moods';
import MoodIcon from './MoodIcon';

interface InsightCardProps {
    insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
    const { theme, primaryColor } = useMood();
    const today = format(new Date(), 'MMM d, yyyy');

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            <View style={styles.glow} />
            <View style={styles.content}>
                <View style={styles.header}>
                    {insight.topMoods && insight.topMoods.length > 0 ? (
                        <View style={styles.topMoodsRow}>
                            {insight.topMoods.map((level, idx) => {
                                const config = MOOD_CONFIGS.find(c => c.level === level);
                                if (!config) return null;
                                return (
                                    <View key={level} style={[styles.miniMoodWrapper, { marginLeft: idx === 0 ? 0 : -20, zIndex: 10 - idx }]}>
                                        <MoodIcon
                                            iconName={config.icon}
                                            size={32}
                                            color={config.color}
                                            customImage={config.customImage}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    ) : insight.moodLevel ? (
                        <View style={styles.moodIconWrapper}>
                            {(() => {
                                const config = MOOD_CONFIGS.find(c => c.level === insight.moodLevel);
                                return config ? (
                                    <MoodIcon
                                        iconName={config.icon}
                                        size={46}
                                        color={config.color}
                                        customImage={config.customImage}
                                    />
                                ) : <Sparkles size={24} color={primaryColor} />;
                            })()}
                        </View>
                    ) : (
                        <View style={[styles.iconContainer, { backgroundColor: primaryColor + '15' }]}>
                            <Sparkles size={18} color={primaryColor} />
                        </View>
                    )}
                </View>
                    <View style={styles.titleArea}>
                        <Text style={[styles.title, { color: theme.text }]}>{insight.title}</Text>
                        <View style={styles.dateRow}>
                            <Calendar size={10} color={theme.textSecondary} />
                            <Text style={[styles.dateText, { color: theme.textSecondary }]}>REPORT • {today}</Text>
                        </View>
                    </View>

                {(insight.topMoods || insight.moodLevel) && (
                    <View style={styles.moodDetailRow}>
                        <View style={styles.smallLine} />
                    </View>
                )}

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
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
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
        alignItems: 'center',
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
        textAlign: 'center',
    },
    topMoodsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        paddingLeft: 4,
    },
    miniMoodWrapper: {
        width: 36,
        height: 36,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation:3,
        borderWidth: 2,
        borderColor: '#F8F9FA',
    },
    moodIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    moodDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    smallLine: {
        width: 15,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 10,
    },
    moodLabel: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
