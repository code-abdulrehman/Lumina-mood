import React from 'react';
import { Platform } from 'react-native';
import { useMood } from '../context/MoodContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StreakScreen } from '../screens/StreakScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Home, BarChart2, History, Flame, Settings } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const insets = useSafeAreaInsets();
    const { primaryColor } = useMood();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    // Use automatic height with padding from insets
                    height: (Platform.OS === 'ios' ? 55 : 60) + insets.bottom,
                    paddingBottom: insets.bottom || 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: primaryColor,
                tabBarInactiveTintColor: '#9CA3AF',
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
    );
};
