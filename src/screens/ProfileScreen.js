import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Button, ConfirmDialog, Screen } from '../components/ui';
import { styles } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { profile, orders, pricing, action, reset, busy } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        Your profile
      </Text>
      <View style={styles.card}>
        <Text style={styles.heading}>{profile.name}</Text>
        <Text style={styles.muted}>
          Local profile · {orders.length} saved orders · {pricing.itemCount} drinks in cart
        </Text>
      </View>
      <Text style={styles.muted}>
        Profiles are stored on this device without passwords. Switch profiles to keep your carts and
        orders separate.
      </Text>
      <Button title="Browse coffee" secondary onPress={() => navigation.navigate('Home')} />
      <Button title="Open cart" secondary onPress={() => navigation.navigate('Cart')} />
      <Button title="Switch profile" onPress={() => action('leaveProfile')} disabled={busy} />
      <Button
        title="Reset local data"
        secondary
        danger
        onPress={() => setConfirmReset(true)}
        disabled={busy}
      />
      <ConfirmDialog
        visible={confirmReset}
        title="Reset local data?"
        message="This starts a fresh app with no profiles, cart items, or orders. A recovery copy of the current data will be kept."
        confirmLabel="Reset local data"
        onConfirm={reset}
        onCancel={() => setConfirmReset(false)}
        busy={busy}
      />
    </Screen>
  );
}
