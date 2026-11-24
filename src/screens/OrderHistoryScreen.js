import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Button, EmptyState, Screen } from '../components/ui';
import { formatMoney } from '../utils/pricing';
import { styles } from '../theme';

export default function OrderHistoryScreen({ navigation }) {
  const { orders, action, busy } = useApp();
  const reorder = async (orderId) => {
    const result = await action('reorder', { orderId });
    if (result.ok) navigation.navigate('Cart');
  };
  return (
    <Screen scroll={false}>
      <Text accessibilityRole="header" style={styles.title}>
        Your orders
      </Text>
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        renderItem={({ item }) => {
          const count = item.lines.reduce((sum, line) => sum + line.quantity, 0);
          return (
            <View style={styles.card}>
              <Text style={styles.heading}>
                {item.id} · {formatMoney(item.totalCents)}
              </Text>
              <Text style={styles.muted}>
                {new Date(item.createdAt).toLocaleString()} · {count}{' '}
                {count === 1 ? 'drink' : 'drinks'}
              </Text>
              <Text style={styles.text}>
                {item.lines.map((line) => `${line.name} × ${line.quantity}`).join(', ')}
              </Text>
              <View style={styles.wrap}>
                <Button
                  title={`Receipt ${item.id}`}
                  secondary
                  onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                />
                <Button
                  title={`Reorder ${item.id}`}
                  onPress={() => reorder(item.id)}
                  disabled={busy}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No orders yet"
            message="Your saved orders and receipts will appear here."
          >
            <Button title="Browse coffee" onPress={() => navigation.navigate('Home')} />
          </EmptyState>
        }
      />
    </Screen>
  );
}
