import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { describeSelection } from '../data/options';
import { Button, EmptyState, Notice, Screen, Totals } from '../components/ui';
import { formatMoney } from '../utils/pricing';
import { returnToTab } from '../utils/navigation';
import { styles } from '../theme';

export default function CheckoutScreen({ navigation }) {
  const { cart, pricing, action, busy } = useApp();
  const submitting = useRef(false);
  const placeOrder = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const result = await action('checkout', { cartRevision: cart.revision });
      if (result.ok) navigation.replace('OrderSuccess', { orderId: result.value.id });
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Screen header>
      <Text accessibilityRole="header" style={styles.title}>
        Review your order
      </Text>
      <Notice>
        Orders are saved on this device. No payment is collected or order sent to a café.
      </Notice>
      {!pricing.lines.length ? (
        <EmptyState title="Your cart is empty" message="Add a coffee before placing an order.">
          <Button title="Browse coffee" onPress={() => returnToTab(navigation)} />
        </EmptyState>
      ) : (
        <>
          {pricing.lines.map((line) => (
            <View key={line.id} style={styles.card}>
              <Text style={styles.heading}>
                {line.name} × {line.quantity}
              </Text>
              <Text style={styles.muted}>{describeSelection(line.selection)}</Text>
              <Text style={styles.text}>{formatMoney(line.totalCents)}</Text>
            </View>
          ))}
          <View style={styles.card}>
            <Totals {...pricing} />
          </View>
          <Button
            title={`Place local order · ${formatMoney(pricing.totalCents)}`}
            onPress={placeOrder}
            loading={busy}
          />
        </>
      )}
    </Screen>
  );
}
