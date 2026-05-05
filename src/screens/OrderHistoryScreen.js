// =============================================================
// File: src/screens/OrderHistoryScreen.js
// Coffee Bliss — Order History Screen
// Displays a list of all previous orders stored locally per user.
// Allows viewing receipt details or reordering previous purchases.
// Uses AsyncStorage for persistence and Haptics for tactile feedback.
// =============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { keyFor } from '../utils/storageKeys';

// ---- Theme (consistent with app palette) ----
const colors = {
  background: '#201A18',
  card: '#4E3E38',
  cardAlt: '#3F332F',
  chip: '#3B302C',
  text: '#F6F1EE',
  subtext: '#DCCFC9',
  accent: '#C67C4E',
  border: '#3A2E2A',
  danger: '#FFB4A2',
};

// ---- Pricing helpers (mirror Details/Cart/Checkout) ----
// Used for recomputing price when reordering to avoid stale totals
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

// Adds or subtracts based on cup size (S: -0.5, L: +1.0)
const sizeDelta = (s) => (s === 'L' ? 1.0 : s === 'S' ? -0.5 : 0);

// Add-on pricing: sum of strength, milk, foam, and toppings
const addOnsPrice = (l) => {
  const o = l?.options || {};
  const toppingSum = (o.toppings || []).reduce((sum, t) => {
    const found = TOPPINGS.find((x) => x.key === t);
    return sum + (found?.price || 0);
  }, 0);
  return (
    (STRENGTH_PRICE[o.strength] || 0) +
    (MILK_PRICE[o.milk] || 0) +
    (FOAM_PRICE[o.foam] || 0) +
    toppingSum
  );
};

// Calculates full unit price from base price + add-ons + size delta
const lineUnitPrice = (l) => {
  const base = Number(l?.basePrice ?? l?.price ?? 0);
  return +(base + sizeDelta(l?.size) + addOnsPrice(l)).toFixed(2);
};

// ---- Small helpers ----
const $ = (n) => `$${Number(n).toFixed(2)}`;                // currency format
const dateish = (iso) => new Date(iso).toLocaleString();     // readable date

export default function OrderHistoryScreen({ navigation }) {
  // ---- Context & storage keys ----
  const { user } = useAuth();
  const HISTORY_KEY = keyFor('cb_history', user); // unique key for each user’s order history
  const CART_KEY = keyFor('cb_cart', user);       // user’s current cart key

  // ---- State ----
  const [orders, setOrders] = useState([]);       // all orders loaded from storage
  const [refreshing, setRefreshing] = useState(false); // for pull-to-refresh spinner

  // ---- Load order history from AsyncStorage ----
  const load = useCallback(async () => {
    try {
      const str = await AsyncStorage.getItem(HISTORY_KEY);
      const arr = str ? JSON.parse(str) : [];
      setOrders(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn('history load error', e);
      setOrders([]);
    }
  }, [HISTORY_KEY]);

  // Reload when screen regains focus (ensures list stays up to date)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Pull-to-refresh logic
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ---- Reorder feature ----
  // Rebuilds the cart by re-adding all items from a previous order.
  // If identical line already exists, merge quantities.
  const reorder = useCallback(async (order) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Get existing cart (if any)
      const cartStr = await AsyncStorage.getItem(CART_KEY);
      const cart = cartStr ? JSON.parse(cartStr) : [];
      let next = Array.isArray(cart) ? [...cart] : [];

      // Merge or push each item from old order
      for (const l of order.items) {
        const unit = lineUnitPrice(l);
        const existingIdx = next.findIndex((x) => x.lineId === l.lineId);

        if (existingIdx >= 0) {
          // Update quantity if already present
          const qty = (next[existingIdx].qty || 1) + (l.qty || 1);
          next[existingIdx] = {
            ...next[existingIdx],
            qty,
            subtotal: +(unit * qty).toFixed(2),
          };
        } else {
          // Add new line item with recalculated price and subtotal
          next.push({ ...l, price: unit, subtotal: +(unit * (l.qty || 1)).toFixed(2) });
        }
      }

      // Persist updated cart and navigate to Cart screen
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      navigation.navigate('Cart');
    } catch (e) {
      console.warn('reorder error', e);
    }
  }, [CART_KEY, navigation]);

  // ---- Small UI subcomponents ----

  // Simple rounded pill for tags (e.g., total, item count)
  const Pill = ({ text }) => (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderColor: colors.border,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: '700' }}>{text}</Text>
    </View>
  );

  // Card container for each order in the list
  const Card = ({ children }) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );

  // ---- FlatList item renderer (one order card) ----
  const renderItem = ({ item }) => {
    const total = item.pricing?.total ?? item.total ?? 0;
    const count = item.items?.length ?? 0;
    const firstTwo = (item.items || [])
      .slice(0, 2)
      .map((l) => `${l.name} (${l.size}) ×${l.qty}`)
      .join(' · ');
    const more = Math.max(0, count - 2);

    return (
      <Card>
        {/* Header row with order ID + date */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '900' }}>#{item.id}</Text>
          <Text style={{ color: colors.subtext }}>{dateish(item.createdAt)}</Text>
        </View>

        {/* Short summary of items (first 2 only for compactness) */}
        <Text style={{ color: colors.subtext, marginBottom: 10 }}>
          {firstTwo}
          {more ? ` · +${more} more` : ''}
        </Text>

        {/* Info chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <Pill text={`${count} item${count > 1 ? 's' : ''}`} />
          <Pill text={`${$(total)}`} />
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* View receipt button */}
          <Pressable
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
            style={{
              flex: 1,
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
              borderWidth: 1,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="receipt-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '800' }}>View receipt</Text>
          </Pressable>

          {/* Reorder button */}
          <Pressable
            onPress={() => reorder(item)}
            style={{
              flex: 1,
              backgroundColor: colors.accent,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Reorder</Text>
          </Pressable>
        </View>
      </Card>
    );
  };

  // Empty-state placeholder when no orders exist
  const EmptyState = () => (
    <View style={{ alignItems: 'center', marginTop: 48 }}>
      <View
        style={{
          backgroundColor: colors.card,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Ionicons name="time-outline" size={36} color={colors.subtext} />
      </View>
      <Text style={{ color: colors.subtext }}>
        No orders yet. Place your first order to see it here.
      </Text>
    </View>
  );

  // ---- Render screen ----
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, flex: 1 }}>
        {/* Screen title */}
        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: '900',
            marginBottom: 8,
          }}
        >
          Order History
        </Text>

        {/* FlatList for orders (scrollable + pull to refresh) */}
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              titleColor={colors.subtext}
              progressBackgroundColor={colors.cardAlt}
              colors={[colors.accent]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}
