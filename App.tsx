import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MoodProvider } from './src/context/MoodContext';
import { MainNavigator } from './src/navigation/MainNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MoodProvider>
          <NavigationContainer>
            <MainNavigator />
            <StatusBar style="dark" />
          </NavigationContainer>
        </MoodProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
