import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MoodProvider } from './src/context/MoodContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <MoodProvider>
        <NavigationContainer>
          <TabNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </MoodProvider>
    </SafeAreaProvider>
  );
}
