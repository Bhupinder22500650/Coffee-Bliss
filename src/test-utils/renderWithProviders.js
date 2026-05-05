// test-utils/renderWithProviders.js
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';

export function renderWithProviders(ui, options) {
  return render(
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>{ui}</NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>,
    options
  );
}
