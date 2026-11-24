import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { describeSelection } from '../data/options';
import QuantitySelector from '../components/QuantitySelector';
import { Button, ConfirmDialog, EmptyState, Screen, Totals } from '../components/ui';
import { formatMoney } from '../utils/pricing';
import { styles } from '../theme';

export default function CartScreen({ navigation }) {
  const { pricing, action, busy } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);
  const clear = async () => {
    const result = await action('clearCart');
    if (result.ok) setConfirmClear(false);
  };
  return (
    <Screen scroll={false}>
      <Text accessibilityRole="header" style={styles.title}>
        Your cart
      </Text>
      <FlatList
        data={pricing.lines}
        keyExtractor={(line) => line.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.heading}>{item.name}</Text>
            <Text style={styles.muted}>{describeSelection(item.selection)}</Text>
            <Text style={styles.text}>
              {formatMoney(item.unitCents)} each · {formatMoney(item.totalCents)}
            </Text>
            <QuantitySelector
              value={item.quantity}
              disabled={busy}
              onChange={(next) =>
                action('changeQuantity', { lineId: item.id, delta: next - item.quantity })
              }
            />
            <View style={styles.wrap}>
              <Button
                title={`Edit ${item.name}`}
                secondary
                disabled={busy}
                onPress={() =>
                  navigation.navigate('Details', { productId: item.productId, lineId: item.id })
                }
              />
              <Button
                title={`Remove ${item.name}`}
                secondary
                danger
                disabled={busy}
                onPress={() => action('removeItem', { lineId: item.id })}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState title="Your cart is empty" message="Choose a coffee and make it your own.">
            <Button title="Browse coffee" onPress={() => navigation.navigate('Home')} />
          </EmptyState>
        }
      />
      {pricing.lines.length > 0 && (
        <View style={styles.card}>
          <Totals {...pricing} />
          <Button
            title="Review order"
            onPress={() => navigation.navigate('Checkout')}
            disabled={busy}
          />
          <Button
            title="Clear cart"
            secondary
            disabled={busy}
            onPress={() => setConfirmClear(true)}
          />
        </View>
      )}
      <ConfirmDialog
        visible={confirmClear}
        title="Clear your cart?"
        message="All drinks in this cart will be removed."
        confirmLabel="Clear cart"
        onConfirm={clear}
        onCancel={() => setConfirmClear(false)}
        busy={busy}
      />
    </Screen>
  );
}
