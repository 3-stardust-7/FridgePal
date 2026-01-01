import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import store from './store/store';
import { Provider } from 'react-redux';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import UniversalNavi from './Navigation/Universal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/hooks/useAuth';

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" />
          <UniversalNavi />
        </SafeAreaProvider>
      </AuthProvider>
    </Provider>
  );
}
