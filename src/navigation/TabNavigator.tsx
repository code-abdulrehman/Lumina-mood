import React from 'react';
import { View, Platform } from 'react-native';
import { useMood } from '../context/MoodContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeshBackground } from '../components/MeshBackground';
import { HomeScreen } from '../screens/HomeScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StreakScreen } from '../screens/StreakScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Home, BarChart2, History, Flame, Settings } from 'lucide-react-native';
const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const insets = useSafeAreaInsets();
    const { primaryColor, theme } = useMood();

    return (
        <MeshBackground>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    sceneStyle: { backgroundColor: 'transparent' },
                    tabBarStyle: {
                        backgroundColor: theme.background,
                        borderTopLeftRadius: 40,
                        borderTopRightRadius: 40,
                        borderTopWidth: 0,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -0.5 },
                        shadowOpacity: 0.2,
                        shadowRadius: 1,
                        elevation: 3,
                        // Use automatic height with padding from insets
                        height: (Platform.OS === 'ios' ? 55 : 60) + insets.bottom,
                        paddingBottom: insets.bottom || 10,
                        paddingTop: 10,
                    },
                    tabBarActiveTintColor: primaryColor,
                    tabBarInactiveTintColor: theme.text + '60',
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '700',
                        marginBottom: Platform.OS === 'android' ? 5 : 0,
                    },
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarIcon: ({ color }) => <Home size={22} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Streak"
                    component={StreakScreen}
                    options={{
                        tabBarIcon: ({ color }) => <Flame size={22} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Insights"
                    component={InsightsScreen}
                    options={{
                        tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="History"
                    component={HistoryScreen}
                    options={{
                        tabBarIcon: ({ color }) => <History size={22} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
                    }}
                />
            </Tab.Navigator>
        </MeshBackground>
    );
};