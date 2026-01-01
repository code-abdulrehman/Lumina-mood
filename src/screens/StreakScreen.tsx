import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMood } from '../context/MoodContext';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { Flame, Star, Trophy, Target, Share2, Sparkles, Award, Zap } from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';

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
            const uri = await captureRef(viewShotRef, { format: 'png', quality: 1.0 });
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
        <View style={styles.mainContainer}>
            {/* AMBIENT BACKGROUND */}
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '10', top: -100, right: -100 }]} />
            <View style={[styles.bgCircle, { backgroundColor: primaryColor + '05', bottom: -50, left: -50, width: 400, height: 400 }]} />

            <ScrollView
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Ritual</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your daily emotional persistence.</Text>
                </View>

                {/* PREMIUM STREAK CARD */}
                <View style={styles.cardWrapper}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                        <View style={[styles.streakCard, { backgroundColor: primaryColor, borderRadius: 32 }]}>
                            <View style={[styles.circleOverlay, { top: -40, left: -40 }]} />
                            <View style={styles.cardHeader}>
                                <View style={styles.badgeWrapper}>
                                    <View style={styles.miniBadge}>
                                        <Award size={10} color={primaryColor} />
                                        <Text style={[styles.miniBadgeText, { color: primaryColor }]}>Neural Core</Text>
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
                                    <Text style={styles.streakLabel}>Day Streak</Text>
                                </View>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.footerBranding}>
                                    <Text style={styles.brandingText}>LUMINA NEURAL</Text>
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
                        style={[styles.actionBtn, { backgroundColor: primaryColor }]}
                    >
                        <Share2 size={18} color="#FFF" />
                        <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Export Achievement</Text>
                    </TouchableOpacity>
                </View>

                {/* WEEKLY PERSISTENCE - GLASS */}
                <View style={styles.timelineSection}>
                    <View style={styles.sectionHeader}>
                        <Zap size={18} color={primaryColor} />
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Weekly Persistence</Text>
                    </View>

                    <BlurView intensity={40} tint="light" style={[styles.pillBoard, { borderColor: theme.glassBorder }]}>
                        {timelineDays.map((day, index) => {
                            const active = hasMoodOnDay(day);
                            const isToday = index === 3;

                            return (
                                <View key={index} style={styles.pillCol}>
                                    <View style={[
                                        styles.pillContainer,
                                        { backgroundColor: theme.darkGlass, borderColor: active ? primaryColor : 'transparent' }
                                    ]}>
                                        <View style={[styles.pillFill, { backgroundColor: active ? primaryColor : "transparent" }]}>
                                            <Flame
                                                size={16}
                                                color={active ? "#FFF" : theme.textSecondary + '20'}
                                                fill={active ? "#FFF" : "transparent"}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.pillDate,
                                            { color: active ? primaryColor : theme.textSecondary }
                                        ]}>
                                            {format(day, 'd')}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.pillDayName,
                                        { color: isToday ? primaryColor : theme.textSecondary, fontWeight: isToday ? '900' : '700' }
                                    ]}>
                                        {format(day, 'EEE')[0]}
                                    </Text>
                                </View>
                            );
                        })}
                    </BlurView>
                </View>

                {/* STATS OVERVIEW - GLASS */}
                <View style={styles.statsRow}>
                    <BlurView intensity={30} tint="light" style={[styles.statBox, { borderColor: theme.glassBorder }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>{moods.length}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Logs</Text>
                    </BlurView>
                    <BlurView intensity={30} tint="light" style={[styles.statBox, { borderColor: theme.glassBorder }]}>
                        <Text style={[styles.statValue, { color: theme.text }]}>Lv. {Math.ceil(moods.length / 5)}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Focus Score</Text>
                    </BlurView>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },
    container: { paddingHorizontal: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    subtitle: { fontSize: 15, fontWeight: '600', opacity: 0.7 },
    cardWrapper: { marginBottom: 28, borderRadius: 32, overflow: 'hidden' },
    streakCard: { padding: 30, position: 'relative', overflow: 'hidden' },
    circleOverlay: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFF', opacity: 0.1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    badgeWrapper: { flexDirection: 'row' },
    miniBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
    miniBadgeText: { fontSize: 9, fontWeight: '900', marginLeft: 4, textTransform: 'uppercase' },
    streakContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 35 },
    outerRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 25 },
    innerRing: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    streakTextGroup: { alignItems: 'flex-start' },
    streakNumber: { fontSize: 72, fontWeight: '900', color: '#FFF', lineHeight: 72 },
    streakLabel: { fontSize: 16, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 },
    cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 20, alignItems: 'center' },
    footerBranding: { flexDirection: 'row', alignItems: 'center' },
    brandingText: { fontSize: 11, fontWeight: '900', color: '#FFF', letterSpacing: 2, opacity: 0.8 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginHorizontal: 10, opacity: 0.8 },

    actionRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 36 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 24 },
    actionBtnText: { fontSize: 15, fontWeight: '900', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1 },

    timelineSection: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginLeft: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
    pillBoard: {
        paddingVertical: 32,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderRadius: 28,
        borderWidth: 1,
        overflow: 'hidden',
    },
    pillCol: { alignItems: 'center', flex: 1 },
    pillContainer: {
        width: 34,
        height: 86,
        borderRadius: 17,
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 4,
        marginBottom: 12,
        borderWidth: 1,
    },
    pillFill: {
        width: '100%',
        height: '65%',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillDate: { fontSize: 12, fontWeight: '900', marginTop: 6 },
    pillDayName: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, paddingVertical: 28, marginHorizontal: 6, alignItems: 'center', borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
    statValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }
});
