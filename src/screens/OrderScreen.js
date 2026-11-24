import React from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { describeSelection } from '../data/options';
import { Button, EmptyState, Screen, Totals } from '../components/ui';
import { formatMoney } from '../utils/pricing';
import { returnToTab } from '../utils/navigation';
import { styles } from '../theme';

export default function OrderScreen({ route, navigation }) {
  const { orders } = useApp();
  const order = orders.find((item) => item.id === route.params?.orderId);
  if (!order)
    return (
      <Screen header>
        <EmptyState title="Order not found" message="Choose an order from your history.">
          <Button title="Open orders" onPress={() => returnToTab(navigation, 'Orders')} />
        </EmptyState>
      </Screen>
    );
  const count = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Screen header>
      <Text accessibilityRole="header" style={styles.title}>
        {route.name === 'OrderSuccess' ? 'Your order is saved' : 'Order receipt'}
      </Text>
      <Text style={styles.muted}>
        {order.id} · {new Date(order.createdAt).toLocaleString()}
      </Text>
      <Text style={styles.text}>
        {count} {count === 1 ? 'drink' : 'drinks'} · Stored on this device
      </Text>
      {order.lines.map((line, index) => (
        <View key={`${line.productId}:${index}`} style={styles.card}>
          <Text style={styles.heading}>
            {line.name} × {line.quantity}
          </Text>
          <Text style={styles.muted}>{describeSelection(line.selection)}</Text>
          <Text style={styles.text}>
            {formatMoney(line.unitCents)} each · {formatMoney(line.totalCents)}
          </Text>
        </View>
      ))}
      <View style={styles.card}>
        <Totals {...order} />
      </View>
      <Button title="Back to menu" onPress={() => returnToTab(navigation)} />
      <Button title="Order history" secondary onPress={() => returnToTab(navigation, 'Orders')} />
    </Screen>
  );
}
