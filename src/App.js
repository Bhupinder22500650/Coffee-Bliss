import React, { useState } from 'react';
import { ActivityIndicator, StatusBar, Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppProvider, useApp } from './context/AppContext';
import { Button, ConfirmDialog, Screen } from './components/ui';
import ProfilesScreen from './screens/ProfilesScreen';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import OrderScreen from './screens/OrderScreen';
import ProfileScreen from './screens/ProfileScreen';
import { colors, styles } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icons = { Home: 'cafe', Cart: 'cart', Orders: 'time', Profile: 'person' };
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function Tabs() {
  const { pricing } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={`${icons[route.name]}${focused ? '' : '-outline'}`}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Menu' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarBadge: pricing.itemCount || undefined }}
      />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Navigator() {
  const { profile, state, loading, busy, reload, reset } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  if (loading)
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} accessibilityLabel="Loading local data" />
      </Screen>
    );
  if (!state)
    return (
      <Screen>
        <Text style={styles.title}>Local data could not be loaded</Text>
        <Text style={styles.muted}>
          Try loading again. If the saved data cannot be recovered, you can start fresh.
        </Text>
        <Button title="Try again" onPress={reload} disabled={busy} />
        <Button
          title="Reset local data"
          secondary
          onPress={() => setConfirmReset(true)}
          disabled={busy}
        />
        <ConfirmDialog
          visible={confirmReset}
          title="Start fresh?"
          message="The current saved data will be backed up before a new local store is created."
          confirmLabel="Reset local data"
          onConfirm={async () => {
            const result = await reset();
            if (result.ok) setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
          busy={busy}
        />
      </Screen>
    );
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Back' }}>
      {profile ? (
        <Stack.Group navigationKey={profile.id}>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Details"
            component={DetailsScreen}
            options={({ route }) => ({
              title: route.params?.lineId ? 'Edit coffee' : 'Customize coffee',
            })}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
          <Stack.Screen
            name="OrderSuccess"
            component={OrderScreen}
            options={{ title: 'Order saved' }}
          />
          <Stack.Screen
            name="OrderDetails"
            component={OrderScreen}
            options={{ title: 'Receipt' }}
          />
        </Stack.Group>
      ) : (
        <Stack.Screen name="Profiles" component={ProfilesScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer
          theme={navigationTheme}
          documentTitle={{
            formatter: (options, route) =>
              `${options?.title || route?.name || 'Menu'} | Coffee Bliss`,
          }}
        >
          <Navigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
