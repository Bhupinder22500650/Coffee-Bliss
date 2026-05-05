// =============================================================
// File: src/screens/CheckoutScreen.js — Minimal
// Clean summary + GST + Place Order. No fulfilment, contact, or promos.
// Pricing recomputed from basePrice + size delta + add-ons (no double-counting).
// =============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, SafeAreaView, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { keyFor } from '../utils/storageKeys';

export default function CheckoutScreen({ navigation }) {
  // ——— Theme ———
  // Centralised palette so colours match Cart/Details and are easy to tweak
  const colors = {
    background: '#201A18',
    card: '#4E3E38',
    cardAlt: '#3F332F',
    text: '#F6F1EE',
    subtext: '#DCCFC9',
    accent: '#C67C4E',
    border: '#3A2E2A',
  };

  // ——— Keys / Context ———
  // Persist orders per authenticated user. keyFor() namespaces storage safely.
  const { user } = useAuth();
  const CART_KEY = keyFor('cb_cart', user);
  const HISTORY_KEY = keyFor('cb_history', user);

  // ——— Pricing (must mirror DetailsScreen & CartScreen to avoid drift) ———
  // Any changes here should be done in all three screens.
  const TOPPINGS = [
    { key: 'Chocolate Drizzle', price: 0.5 },
    { key: 'Caramel Drizzle', price: 0.5 },
    { key: 'Whipped Cream', price: 0.7 },
    { key: 'Cocoa Powder', price: 0.3 },
    { key: 'Cinnamon', price: 0.3 },
  ];
  const STRENGTH_PRICE = { Single: 0, Double: 0.8, 'Extra Strong': 1.5 };
  const MILK_PRICE = { Whole: 0, Trim: 0, Oat: 0.7, Almond: 0.7, Soy: 0.5 };
  const FOAM_PRICE = { 'No Foam': 0, 'Light Foam': 0, 'Extra Foam': 0.3, Creamy: 0.4 };
  // Size delta is applied to the original base price
  const sizeDelta = (s) => (s === 'L' ? 1.0 : s === 'S' ? -0.5 : 0);

  // Sum add-on costs for a single unit
  const addOnsPrice = (l) => {
    const o = l?.options || {};
    const toppingSum = (o.toppings || []).reduce((sum, t) => {
      const found = TOPPINGS.find((x) => x.key === t);
      return sum + (found?.price || 0);
    }, 0);
    return (STRENGTH_PRICE[o.strength] || 0) + (MILK_PRICE[o.milk] || 0) + (FOAM_PRICE[o.foam] || 0) + toppingSum;
  };

  // Unit price recomputed from base each render (prevents double-count when editing)
  const lineUnitPrice = (l) => {
    const base = Number(l?.basePrice ?? l?.price ?? 0);
    return +(base + sizeDelta(l?.size) + addOnsPrice(l)).toFixed(2);
  };

  // Line subtotal = unit * qty
  const lineSubtotal = (l) => +(lineUnitPrice(l) * Number(l.qty || 1)).toFixed(2);

  // Pretty option line for the summary
  const optionText = (l) => {
    const o = l?.options || {};
    return [
      l.size ? `Size ${l.size}` : null,
      o.temperature,
      o.strength,
      o.foam,
      o.milk,
      o.sweetener && o.sweetener !== 'None' ? o.sweetener : null,
      (o.toppings || []).length ? o.toppings.join(', ') : null,
    ].filter(Boolean).join(' • ');
  };

  // ——— State ———
  const [lines, setLines] = useState([]);   // cart lines as shown on checkout
  const [loading, setLoading] = useState(true);

  // Load cart once on mount; compute each line's subtotal immediately
  useEffect(() => {
    (async () => {
      try {
        const str = await AsyncStorage.getItem(CART_KEY);
        const arr = str ? JSON.parse(str) : [];
        const prepared = (Array.isArray(arr) ? arr : []).map((l) => ({ ...l, subtotal: lineSubtotal(l) }));
        setLines(prepared);
      } catch (e) {
        console.warn('checkout load error', e);
        setLines([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [CART_KEY]);

  // ——— Totals (memoised) ———
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.subtotal || 0), 0),
    [lines]
  );
  const gst = useMemo(() => +(subtotal * 0.15).toFixed(2), [subtotal]); // NZ GST 15%
  const total = useMemo(() => +(subtotal + gst).toFixed(2), [subtotal, gst]);

  // ——— Place Order flow ———
  // 1) Haptic success
  // 2) Append order object to history (local only)
  // 3) Clear cart + navigate to success screen
  // NOTE: No payment gateway or fulfilment here; this is a minimal academic flow.
  const placeOrder = async () => {
    if (!lines.length) {
      Alert.alert('Cart is empty', 'Add some items first.');
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Read existing history (FIFO: new first)
      const historyStr = await AsyncStorage.getItem(HISTORY_KEY);
      const history = historyStr ? JSON.parse(historyStr) : [];

      // Construct a lightweight order snapshot for Order History / Success screens
      const order = {
        id: `ord_${Date.now()}`, // simple unique id
        items: lines,
        pricing: { subtotal, gst, total },
        meta: {
          isDelivery: false,         // minimal flow: pickup assumed
          address: null,             // left for future extension
          name: null,
          phone: null,
          notes: null,
          promo: null,
          etaMinutes: 15,            // static ETA for demo
        },
        createdAt: new Date().toISOString(),
        user: { email: user?.email ?? null, uid: user?.uid ?? null },
      };

      // Persist: push to top of history list
      history.unshift(order);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      // Clear cart after successful "order"
      await AsyncStorage.removeItem(CART_KEY);
      setLines([]);

      // Replace to avoid back-nav returning to checkout with stale state
      navigation.replace('OrderSuccess', {
        orderId: order.id,
        total: order.pricing.total,
        etaMinutes: order.meta.etaMinutes,
      });
    } catch (e) {
      console.warn('placeOrder error', e);
      // In a real app, this would map payment/connection errors to user-friendly messages
      Alert.alert('Oops', 'Payment failed. Please try again.');
    }
  };

  // Small presentational row for key/value totals; bold toggles emphasis
  const Row = ({ left, right, bold }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ color: colors[bold ? 'text' : 'subtext'], fontWeight: bold ? '800' : '500' }}>
        {left}
      </Text>
      <Text style={{ color: colors.text, fontWeight: bold ? '800' : '600' }}>
        {right}
      </Text>
    </View>
  );

  // ——— Render ———
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Order Summary Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 8 }}>
            Order Summary
          </Text>

          {/* Loading / Empty / Lines */}
          {loading ? (
            <Text style={{ color: colors.subtext }}>Loading…</Text>
          ) : !lines.length ? (
            <Text style={{ color: colors.subtext }}>Your cart is empty.</Text>
          ) : (
            lines.map((l) => (
              <View key={l.lineId} style={{ marginBottom: 8 }}>
                {/* Line header: product + size + qty */}
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {l.name} ({l.size}) × {l.qty}
                </Text>
                {/* Human-readable options */}
                <Text style={{ color: colors.subtext, marginBottom: 4 }}>
                  {optionText(l)}
                </Text>
                {/* Per-line total */}
                <Row left="Line" right={`$${Number(l.subtotal || 0).toFixed(2)}`} />
              </View>
            ))
          )}

          {/* Totals */}
          <View style={{ height: 8 }} />
          <Row left="Subtotal" right={`$${subtotal.toFixed(2)}`} />
          <Row left="GST (15%)" right={`$${gst.toFixed(2)}`} />
          <Row left="Total" right={`$${total.toFixed(2)}`} bold />
        </View>

        {/* CTA: Place Order
            Note: Button shows final payable amount to reduce surprises */}
        <Pressable
          onPress={placeOrder}
          style={{
            backgroundColor: colors.accent,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            Place Order • ${total.toFixed(2)}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
