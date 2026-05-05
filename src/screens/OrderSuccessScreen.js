// =============================================================
// File: src/screens/OrderSuccessScreen.js
// Coffee Bliss — Order Success Screen
// Shown immediately after a successful checkout.
// Displays key order information (ID, total, ETA, timestamp) and
// provides navigation options to Menu, Receipt, or Cart.
// =============================================================

import React from 'react';
import { View, Text, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---- Theme (consistent with the rest of the app) ----
const colors = {
  background: '#201A18',
  header: '#2B2320',
  chip: '#3B302C',
  card: '#4E3E38',
  border: '#3A2E2A',
  text: '#F6F1EE',
  subtext: '#DCCFC9',
  accent: '#C67C4E',
};

export default function OrderSuccessScreen({ route, navigation }) {
  // ---- Handle flexible navigation params ----
  // This screen supports multiple param shapes:
  // 1) { orderId, total, etaMinutes }
  // 2) { order: { id, items, pricing, createdAt, meta } }

  const p = route?.params || {};
  const orderObj = p.order || null;

  // Get order ID, fallback to generated ID if missing
  const orderId =
    p.orderId ??
    orderObj?.id ??
    `CB-${Date.now()}`;

  // Extract item list safely from either order object or route params
  const items = Array.isArray(orderObj?.items)
    ? orderObj.items
    : Array.isArray(p.items)
    ? p.items
    : [];

  // Compute total:
  // Prefer param or stored pricing total; fallback to manual line subtotal calculation.
  const totalRaw =
    typeof p.total === 'number'
      ? p.total
      : typeof orderObj?.total === 'number'
      ? orderObj.total
      : typeof orderObj?.pricing?.total === 'number'
      ? orderObj.pricing.total
      : items.reduce(
          (s, i) =>
            s +
            // Prefer subtotal if stored, else recalc from price × qty
            Number(
              i.subtotal ??
                (Number(i.price ?? i.basePrice ?? 0) * Number(i.qty || 1))
            ),
          0
        );

  const total = Number.isFinite(totalRaw) ? totalRaw : 0;

  // ETA (if provided) or null if unavailable
  const etaMinutes =
    p.etaMinutes ??
    orderObj?.meta?.etaMinutes ??
    null;

  // Date/time formatting for “Placed” timestamp
  const ts = orderObj?.createdAt || p.createdAt || Date.now();
  const date = new Date(ts);
  const niceTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // Count number of items for summary
  const itemCount = items.length;

  // ---- UI Rendering ----
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          flex: 1,
          padding: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Header / Success message */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text }}>
            Thanks! 🎉
          </Text>
          <Text style={{ color: colors.subtext, marginTop: 6 }}>
            Your order was placed successfully
            {etaMinutes ? ` — ETA ~${etaMinutes} min` : ''}.
          </Text>
        </View>

        {/* Summary card with receipt info */}
        <View
          style={{
            width: '100%',
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
          }}
        >
          {/* Row: Icon + Order ID */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}
          >
            <View
              style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor: colors.chip,
                borderWidth: 1,
                borderColor: colors.border,
                marginRight: 10,
              }}
            >
              <Ionicons name="receipt-outline" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.subtext }}>Order ID</Text>
              <Text style={{ color: colors.text, fontWeight: '900' }}>
                {orderId}
              </Text>
            </View>
          </View>

          {/* Metadata rows: items, date, total */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.subtext }}>Items</Text>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.subtext }}>Placed</Text>
            <Text style={{ color: colors.text }}>{niceTime}</Text>
          </View>

          {/* Total price summary */}
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text, fontWeight: '900' }}>Total</Text>
            <Text style={{ color: colors.text, fontWeight: '900' }}>
              ${Number(total).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Navigation buttons */}
        <View style={{ width: '100%', marginTop: 18 }}>
          {/* Go back to main menu (Home tab) */}
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            style={{
              backgroundColor: colors.accent,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#1B0F0A', fontWeight: '900' }}>
              Back to Menu
            </Text>
          </Pressable>

          {/* View Receipt button — opens detailed order info */}
          <Pressable
            onPress={() => navigation.replace('OrderDetails', { orderId })}
            style={{
              marginTop: 10,
              backgroundColor: colors.chip,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              View Receipt
            </Text>
          </Pressable>

          {/* Optional: Jump to Cart tab */}
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
            style={{
              marginTop: 10,
              backgroundColor: colors.chip,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              View Cart
            </Text>
          </Pressable>
        </View>

        {/* Friendly message footer */}
        <Text style={{ color: colors.subtext, marginTop: 14, textAlign: 'center' }}>
          We’ll start brewing right away ☕️
        </Text>
      </View>
    </SafeAreaView>
  );
}
