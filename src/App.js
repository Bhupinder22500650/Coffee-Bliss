// App.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './context/AuthContext';

import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderSuccessScreen from './screens/OrderSuccessScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// NEW (make sure these files exist)
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import { OrderDetailsScreen } from './screens/OrderDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size, color }) => {
          let icon = 'home';
          if (route.name === 'Home') icon = focused ? 'cafe' : 'cafe-outline';
          else if (route.name === 'Cart') icon = focused ? 'cart' : 'cart-outline';
          // NEW: icon for Orders tab (history)
          else if (route.name === 'Orders') icon = focused ? 'time' : 'time-outline';
          else if (route.name === 'Profile') icon = focused ? 'person' : 'person-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#C67C4E',
        tabBarInactiveTintColor: '#8d8d8d',
        tabBarStyle: { backgroundColor: '#2B2320', borderTopColor: '#3A2E2A' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      {/* NEW: Orders tab */}
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#201A18' }}>
        <ActivityIndicator color="#C67C4E" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Details" component={DetailsScreen} options={{ headerShown: true, title: 'Details' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, title: 'Checkout' }} />
          <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: true, title: 'Thank you' }} />
          {/* NEW: receipt screen for any order from history */}
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: true, title: 'Order Receipt' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: { ...DefaultTheme.colors, background: '#201A18' },
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
