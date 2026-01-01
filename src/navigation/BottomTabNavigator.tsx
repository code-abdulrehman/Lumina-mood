import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useMood } from '../context/MoodContext';
import { HomeScreen } from '../screens/HomeScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { StreakScreen } from '../screens/StreakScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import {
    Home,
    BarChart2,
    Flame,
    Settings
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
    const { primaryColor, theme } = useMood();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 85 : 65,
                },
                tabBarBackground: () => (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                ),
                tabBarActiveTintColor: primaryColor,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: Platform.OS === 'ios' ? 0 : 8,
                },
                tabBarItemStyle: {
                    paddingTop: 8,
                }
            }}
        >
            <Tab.Screen
                name="Workspace"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color }) => <Home size={22} color={color} />,
                }}
            />
            <Tab.Screen
                name="Rituals"
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
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
};
