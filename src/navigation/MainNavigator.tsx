import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import {
    createDrawerNavigator,
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItemList,
} from '@react-navigation/drawer';
import { BlurView } from 'expo-blur';
import { useMood } from '../context/MoodContext';
import { BottomTabNavigator } from './BottomTabNavigator';
import {
    Layout,
    History,
    BrainCircuit,
    ChevronRight,
    Search,
    Clock,
    Calendar,
    Delete,
    Trash2,
    Smile
} from 'lucide-react-native';
import * as Icons from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';

const Drawer = createDrawerNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
    const { theme, primaryColor, moods, deleteMoodEntry } = useMood();

    const recentMoods = useMemo(() => moods.slice(0, 15), [moods]);

    const handlePress = (mood: any) => {
        props.navigation.navigate('MainTabs', {
            screen: 'Workspace',
            params: { resumeEntry: mood }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                {/* BRANDING */}
                <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
                    <View style={[styles.logoCircle, { backgroundColor: primaryColor + '20' }]}>
                        <BrainCircuit size={28} color={primaryColor} />
                    </View>
                    <View>
                        <Text style={[styles.drawerBrand, { color: theme.text }]}>Lumina</Text>
                        <Text style={[styles.drawerTagline, { color: theme.textSecondary }]}>Neural Mindfulness</Text>
                    </View>
                </View>

                {/* NAVIGATION ITEMS */}
                <View style={styles.drawerItemsContainer}>
                    <DrawerItemList {...props} />
                </View>

                {/* MIND ARCHIVE - IN-DRAWER LISTING */}
                <View style={[styles.historySection, { borderTopColor: theme.border }]}>
                    <View style={styles.historyHeader}>
                        <History size={16} color={theme.textSecondary} />
                        <Text style={[styles.historyTitle, { color: theme.textSecondary }]}>Mind Archive</Text>
                    </View>

                    {recentMoods.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your journal is empty.</Text>
                    ) : (
                        recentMoods.map((mood) => {
                            const date = new Date(mood.timestamp);
                            const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d');
                            const IconComponent = (Icons as any)[mood.iconName] || Smile;

                            return (
                                <TouchableOpacity
                                    key={mood.id}
                                    style={[styles.historyItem, { backgroundColor: theme.darkGlass }]}
                                    onPress={() => handlePress(mood)}
                                >
                                    <View style={[styles.moodDot, { backgroundColor: theme.primary + '20' }]}>
                                        <IconComponent size={14} color={theme.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.historyLabel, { color: theme.text }]} numberOfLines={1}>{mood.label}</Text>
                                        <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{label} • {format(date, 'h:mm a')}</Text>
                                    </View>
                                    <ChevronRight size={14} color={theme.textSecondary} />
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={[styles.drawerInfo, { borderTopColor: theme.border }]}>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>Version 1.5.0 • Glass Edition</Text>
                </View>
            </DrawerContentScrollView>
        </View>
    );
};

export const MainNavigator = () => {
    const { primaryColor, theme } = useMood();

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'slide',
                drawerStyle: {
                    width: SCREEN_WIDTH * 0.85,
                    backgroundColor: 'transparent',
                },
                drawerActiveBackgroundColor: primaryColor + '15',
                drawerActiveTintColor: primaryColor,
                drawerInactiveTintColor: theme.textSecondary,
                drawerLabelStyle: {
                    fontSize: 15,
                    fontWeight: '700',
                    marginLeft: -10,
                },
                drawerItemStyle: {
                    borderRadius: 16,
                    paddingHorizontal: 10,
                    marginVertical: 4,
                }
            }}
        >
            <Drawer.Screen
                name="MainTabs"
                component={BottomTabNavigator}
                options={{
                    drawerIcon: ({ color }) => <Layout size={22} color={color} />,
                    title: 'App Workspace'
                }}
            />
        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerHeader: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        marginBottom: 10,
    },
    logoCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    drawerBrand: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    drawerTagline: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    drawerItemsContainer: {
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    historySection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingLeft: 4,
    },
    historyTitle: {
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 10,
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    moodDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyLabel: {
        fontSize: 14,
        fontWeight: '800',
    },
    historyDate: {
        fontSize: 11,
        fontWeight: '600',
    },
    drawerInfo: {
        marginTop: 40,
        padding: 24,
        borderTopWidth: 1,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
