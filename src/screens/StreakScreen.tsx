import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { Flame, Star, Trophy, Target, Share2, Sparkles, Award, Zap } from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StreakScreen = () => {
    const insets = useSafeAreaInsets();
    const { moods, theme, primaryColor } = useMood();
    const viewShotRef = useRef(null);

    const timelineDays = Array.from({ length: 7 }, (_, i) => {
        const offset = i - 3;
        return addDays(new Date(), offset);
    });

    const hasMoodOnDay = (date: Date) => {
        return moods.some(m => isSameDay(new Date(m.timestamp), date));
    };

    const currentStreakCount = () => {
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const date = subDays(new Date(), i);
            if (hasMoodOnDay(date)) streak++;
            else if (i === 0) continue;
            else break;
        }
        return streak;
    };

    const streak = currentStreakCount();

    const handleShareStreak = async () => {
        try {
            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 1.0,
            });

            if (Platform.OS === 'web') {
                const text = `🔥 I've reached a ${streak}-day mindfulness streak on Lumina Mood! 🧘‍♂️✨`;
                await Share.share({ message: text });
                return;
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Achievement Card',
                    UTI: 'public.png',
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Share Error", "Failed to capture streak card.");
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Ritual</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your daily emotional persistence.</Text>
                </View>

                {/* PREMIUM STREAK CARD WRAPPED IN VIEWSHOT */}
                <View style={styles.cardWrapper}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                        <View style={[styles.streakCard, { backgroundColor: primaryColor, borderRadius: 36 }]}>
                            <View style={[styles.circleOverlay, { top: -40, left: -40 }]} />
                            <View style={[styles.circleOverlay, { bottom: -60, right: -40, width: 150, height: 150, opacity: 0.1 }]} />

                            <View style={styles.cardHeader}>
                                <View style={styles.badgeWrapper}>
                                    <View style={styles.miniBadge}>
                                        <Award size={10} color={primaryColor} />
                                        <Text style={[styles.miniBadgeText, { color: primaryColor }]}>Verified</Text>
                                    </View>
                                </View>
                                <Sparkles size={24} color="#FFF" opacity={0.6} />
                            </View>

                            <View style={styles.streakContent}>
                                <View style={styles.outerRing}>
                                    <View style={styles.innerRing}>
                                        <Flame size={48} color="#FFF" fill="#FFF" />
                                    </View>
                                </View>
                                <View style={styles.streakTextGroup}>
                                    <Text style={styles.streakNumber}>{streak}</Text>
                                    <Text style={styles.streakLabel}>Day Ritual</Text>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.footerBranding}>
                                    <Text style={styles.brandingText}>LUMINA MOOD</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.brandingText}>{format(new Date(), 'yyyy')}</Text>
                                </View>
                            </View>
                        </View>
                    </ViewShot>
                </View>

                {/* ACTION BUTTONS */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        onPress={handleShareStreak}
                        style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                        <Share2 size={18} color={primaryColor} />
                        <Text style={[styles.actionBtnText, { color: primaryColor }]}>Export Achievement</Text>
                    </TouchableOpacity>
                </View>

                {/* UNIQUE VERTICAL PILL TRACKER - REDESIGNED */}
                <View style={styles.timelineSection}>
                    <View style={styles.sectionHeader}>
                        <Zap size={18} color={primaryColor} />
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Weekly Persistence</Text>
                    </View>

                    <View style={[styles.pillBoard, { backgroundColor: theme.card, borderRadius: 32 }]}>
                        {timelineDays.map((day, index) => {
                            const active = hasMoodOnDay(day);
                            const isToday = index === 3;

                            return (
                                <View key={index} style={styles.pillCol}>
                                    <View style={[
                                        styles.pillContainer,
                                        { backgroundColor: theme.border + '30' },
                                        isToday && { borderColor: primaryColor, borderStyle: 'solid' }
                                    ]}>
                                        {active && (
                                            <View style={[styles.pillFill, { backgroundColor: primaryColor }]}>
                                                <Flame size={16} color="#FFF" fill="#FFF" />
                                            </View>
                                        )}
                                        <Text style={[
                                            styles.pillDate,
                                            { color: active ? theme.primary : theme.textSecondary },
                                            active && { marginBottom: 4 }
                                        ]}>
                                            {format(day, 'd')}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.pillDayName,
                                        { color: isToday ? primaryColor : theme.textSecondary, fontWeight: isToday ? '900' : '600' }
                                    ]}>
                                        {format(day, 'EEE')[0]}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* STATS OVERVIEW */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.card, borderRadius: 24 }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{moods.length}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Logs</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.card, borderRadius: 24 }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>Lv. {Math.ceil(moods.length / 5)}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Habit Score</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    container: { paddingHorizontal: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 34, fontWeight: '900' },
    subtitle: { fontSize: 15, fontWeight: '500' },
    cardWrapper: { marginBottom: 20, borderRadius: 36, overflow: 'hidden' },
    streakCard: { padding: 30, position: 'relative', overflow: 'hidden' },
    circleOverlay: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', opacity: 0.1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    badgeWrapper: { flexDirection: 'row' },
    miniBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    miniBadgeText: { fontSize: 10, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },
    streakContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 35 },
    outerRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 25 },
    innerRing: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    streakTextGroup: { alignItems: 'flex-start' },
    streakNumber: { fontSize: 72, fontWeight: '900', color: '#FFF', lineHeight: 72 },
    streakLabel: { fontSize: 16, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 },
    cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 20, alignItems: 'center' },
    footerBranding: { flexDirection: 'row', alignItems: 'center' },
    brandingText: { fontSize: 11, fontWeight: '900', color: '#FFF', letterSpacing: 1.5, opacity: 0.7 },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFF', marginHorizontal: 8, opacity: 0.7 },

    actionRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20, borderWidth: 1 },
    actionBtnText: { fontSize: 14, fontWeight: '800', marginLeft: 10 },

    timelineSection: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },

    // UNIQUE PILL BOARD DESIGN
    pillBoard: {
        paddingVertical: 28,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    pillCol: { alignItems: 'center', flex: 1 },
    pillContainer: {
        width: 32,
        height: 80,
        borderRadius: 16,
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pillFill: {
        width: '100%',
        height: '65%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    pillDate: { fontSize: 12, fontWeight: '900', marginTop: 4 },
    pillDayName: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, paddingVertical: 24, marginHorizontal: 5, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    statValue: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }
});
