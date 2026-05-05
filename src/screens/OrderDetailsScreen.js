// =============================================================
// File: src/screens/OrderDetailsScreen.js
// Coffee Bliss — Order Details / Receipt Screen
// Shows detailed view for a specific order ID (from history).
// Data loaded from AsyncStorage -> cb_history per user.
// Includes order info, items, and pricing breakdown.
// =============================================================

import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { keyFor } from '../utils/storageKeys';

export function OrderDetailsScreen({ route }) {
  // ——— Retrieve params + context ———
  const { orderId } = route.params || {}; // order ID passed via navigation
  const { user } = useAuth();              // get current logged-in user
  const HISTORY_KEY = keyFor('cb_history', user); // per-user key for past orders

  // State: holds the specific order object once loaded
  const [order, setOrder] = useState(null);

  // ——— Load order from AsyncStorage ———
  // 1) Read user's order history from local storage.
  // 2) Parse JSON and find the order matching route param.
  // 3) Save it in local state for rendering.
  useEffect(() => {
    (async () => {
      const str = await AsyncStorage.getItem(HISTORY_KEY);
      const arr = str ? JSON.parse(str) : [];
      setOrder(arr.find(o => String(o.id) === String(orderId)) || null);
    })();
  }, [HISTORY_KEY, orderId]);

  // ——— Fallback if no order found ———
  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#201A18', padding: 16 }}>
        <Text style={{ color: '#DCCFC9' }}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  // ——— Helper: format option text per line item ———
  // Builds readable string like "Size M • Hot • Single • Light Foam • Whole • Honey • Cinnamon"
  const optionText = (l) => {
    const o = l.options || {};
    return [
      l.size && `Size ${l.size}`,
      o.temperature,
      o.strength,
      o.foam,
      o.milk,
      o.sweetener && o.sweetener !== 'None' ? o.sweetener : null,
      o.toppings?.length ? o.toppings.join(', ') : null,
    ]
      .filter(Boolean)
      .join(' • ');
  };

  // ——— Pricing summary ———
  const subtotal = order.pricing?.subtotal ?? 0;
  const gst = order.pricing?.gst ?? 0;
  const total = order.pricing?.total ?? 0;

  // ——— Render ———
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#201A18' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Order card container */}
        <View style={{ backgroundColor: '#4E3E38', padding: 16, borderRadius: 12 }}>
          {/* Order header (ID + timestamp) */}
          <Text style={{ color: '#F6F1EE', fontWeight: '900', fontSize: 18 }}>
            Receipt #{order.id}
          </Text>
          <Text style={{ color: '#DCCFC9', marginBottom: 10 }}>
            {new Date(order.createdAt).toLocaleString()}
          </Text>

          {/* List each item in the order */}
          {order.items.map((l) => (
            <View key={l.lineId} style={{ marginBottom: 8 }}>
              <Text style={{ color: '#F6F1EE', fontWeight: '700' }}>
                {l.name} ({l.size}) × {l.qty}
              </Text>
              <Text style={{ color: '#DCCFC9' }}>{optionText(l)}</Text>
              <Text style={{ color: '#F6F1EE', marginTop: 2 }}>
                Line: ${Number(l.subtotal || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Totals block */}
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#DCCFC9' }}>Subtotal</Text>
            <Text style={{ color: '#F6F1EE' }}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#DCCFC9' }}>GST (15%)</Text>
            <Text style={{ color: '#F6F1EE' }}>${gst.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: '#F6F1EE', fontWeight: '900' }}>Total</Text>
            <Text style={{ color: '#F6F1EE', fontWeight: '900' }}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
