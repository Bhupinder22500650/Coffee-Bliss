// =============================================================
// File: src/screens/CartScreen.js (drop-in)
// Synced with DetailsScreen customisations. No double-count of add-ons.
// Regenerates lineId on edit and merges identical lines.
// =============================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { keyFor } from '../utils/storageKeys';

export default function CartScreen({ navigation }) {
  // ——— Theme ———
  // Centralised color palette for the entire screen to keep UI consistent
  const colors = {
    background: '#201A18',
    card: '#4E3E38',
    cardAlt: '#3F332F',
    chip: '#3B302C',
    text: '#F6F1EE',
    subtext: '#DCCFC9',
    accent: '#C67C4E',
    accentAlt: '#A86238',
    border: '#3A2E2A',
    danger: '#FFB4A2',
    good: '#7AD18C',
  };

  // ——— Option Sets & Pricing ——— (mirror DetailsScreen)
  // NOTE: These must match DetailsScreen to guarantee identical price math.
  const TOPPINGS = [
    { key: 'Chocolate Drizzle', price: 0.5 },
    { key: 'Caramel Drizzle', price: 0.5 },
    { key: 'Whipped Cream', price: 0.7 },
    { key: 'Cocoa Powder', price: 0.3 },
    { key: 'Cinnamon', price: 0.3 },
  ];
  const DEFAULT_OPTIONS = {
    temperature: 'Hot',
    strength: 'Single',
    foam: 'Light Foam',
    sweetener: 'None',
    milk: 'Whole',
    toppings: [],
  };
  // Per-option upcharges used to compute a unit price from a base price
  const STRENGTH_PRICE = { Single: 0, Double: 0.8, 'Extra Strong': 1.5 };
  const MILK_PRICE = { Whole: 0, Trim: 0, Oat: 0.7, Almond: 0.7, Soy: 0.5 };
  const FOAM_PRICE = { 'No Foam': 0, 'Light Foam': 0, 'Extra Foam': 0.3, Creamy: 0.4 };
  // Size delta adjusts the base price (+$1 for L, -$0.5 for S, 0 for M)
  const sizeDelta = (s) => (s === 'L' ? 1.0 : s === 'S' ? -0.5 : 0);

  // ——— Helpers ———
  // Currency format helper
  const $ = (n) => `$${Number(n).toFixed(2)}`;

  // Defensive normaliser: ensures a line has safe defaults and valid shapes
  const normalizeLine = (l) => {
    const safeOptions = {
      ...DEFAULT_OPTIONS,
      ...(l?.options || {}),
      // Guarantee toppings is an array
      toppings: Array.isArray(l?.options?.toppings) ? l.options.toppings : [],
    };
    return { qty: 1, ...l, options: safeOptions };
  };

  // Compute total add-on cost for one unit (shots, milk, foam, toppings)
  const addOnsPrice = (l) => {
    const o = l?.options || DEFAULT_OPTIONS;
    const toppingSum = (o.toppings || []).reduce((sum, t) => {
      const found = TOPPINGS.find((x) => x.key === t);
      return sum + (found?.price || 0);
    }, 0);
    return (STRENGTH_PRICE[o.strength] || 0) + (MILK_PRICE[o.milk] || 0) + (FOAM_PRICE[o.foam] || 0) + toppingSum;
  };

  // IMPORTANT: Unit price is recomputed from the original basePrice every time,
  // so add-ons are never double-counted when editing a line.
  const lineUnitPrice = (l) => {
    const base = Number(l.basePrice ?? l.price ?? 0);
    return +(base + sizeDelta(l.size) + addOnsPrice(l)).toFixed(2);
  };

  // Line subtotal = unit price * qty
  const lineSubtotal = (l) => +(lineUnitPrice(l) * Number(l.qty || 1)).toFixed(2);

  // Renders a compact string like: "Size M • Hot • Single • Light Foam • Whole • Honey • Cinnamon"
  const formatOptions = (l) => {
    const o = l?.options || DEFAULT_OPTIONS;
    return [
      l.size ? `Size ${l.size}` : null,
      o.temperature,
      o.strength,
      o.foam,
      o.milk,
      o.sweetener && o.sweetener !== 'None' ? o.sweetener : null,
      (o.toppings || []).length ? o.toppings.join(', ') : null,
    ]
      .filter(Boolean)
      .join(' • ');
  };

  // ——— Storage ———
  // Persist cart per-user to avoid mixing carts across accounts
  const { user } = useAuth();
  const CART_KEY = keyFor('cb_cart', user);

  // Local UI state
  const [lines, setLines] = useState([]);
  const [editing, setEditing] = useState(null); // holds the line being edited (modal)

  // Loads and normalises cart lines from AsyncStorage
  const load = useCallback(async () => {
    try {
      const str = await AsyncStorage.getItem(CART_KEY);
      const arr = str ? JSON.parse(str) : [];
      const prepared = (Array.isArray(arr) ? arr : []).map((l) => {
        const n = normalizeLine(l);
        return { ...n, subtotal: lineSubtotal(n) };
      });
      setLines(prepared);
    } catch (e) {
      console.warn('Cart load error', e);
      setLines([]);
    }
  }, [CART_KEY]);

  // Writes full cart to AsyncStorage (source of truth)
  const persist = useCallback(
    async (next) => {
      try {
        setLines(next);
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Cart persist error', e);
      }
    },
    [CART_KEY]
  );

  // Reload cart when screen gains focus (keeps Tabs -> Details -> Cart in sync)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Compute total for all lines (memoised for performance)
  const total = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.subtotal || 0), 0),
    [lines]
  );

  // ——— Qty controls ———
  // Increase quantity for a line (with haptic feedback)
  const inc = (lineId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = lines.map((l) => {
      if (l.lineId !== lineId) return l;
      const upd = { ...l, qty: (l.qty || 1) + 1 };
      return { ...upd, subtotal: lineSubtotal(upd) };
    });
    persist(next);
  };

  // Decrease quantity; if qty would drop below 1, remove the line
  const dec = (lineId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const found = lines.find((l) => l.lineId === lineId);
    if (!found) return;
    if (found.qty <= 1) return removeLine(lineId);
    const next = lines.map((l) => {
      if (l.lineId !== lineId) return l;
      const upd = { ...l, qty: (l.qty || 1) - 1 };
      return { ...upd, subtotal: lineSubtotal(upd) };
    });
    persist(next);
  };

  // Remove a single line entirely
  const removeLine = (lineId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const next = lines.filter((l) => l.lineId !== lineId);
    persist(next);
  };

  // Clear entire cart (guarded by a confirmation dialog)
  const clearCart = () => {
    if (!lines.length) return;
    Alert.alert('Clear cart?', 'This will remove all items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await persist([]);
        },
      },
    ]);
  };

  // ——— Editing Modal Logic ———
  // Helper to replace a single option (e.g., strength: 'Double') on the editing line
  const setOpt = (line, key, value) => {
    const updated = {
      ...line,
      options: { ...(line.options || DEFAULT_OPTIONS), [key]: value },
    };
    updated.subtotal = lineSubtotal(updated);
    return updated;
  };

  // Toggle a topping (add/remove from the set), keeping a stable array in options.toppings
  const toggleTopping = (line, t) => {
    const curr = new Set(line?.options?.toppings || []);
    curr.has(t) ? curr.delete(t) : curr.add(t);
    const updated = {
      ...line,
      options: { ...(line.options || DEFAULT_OPTIONS), toppings: Array.from(curr) },
    };
    updated.subtotal = lineSubtotal(updated);
    return updated;
  };

  // Normalised key that represents a drink configuration that affects price/identity
  // Used to determine when two lines are "identical" for merging
  const optionKeyFor = (l) => {
    const o = l?.options || DEFAULT_OPTIONS;
    return [
      l.size,
      o.temperature,
      o.strength,
      o.foam,
      o.sweetener,
      o.milk,
      // Sort toppings so order doesn't create duplicate identities
      [...(o.toppings || [])].sort().join('+'),
    ].join('|');
  };

  // New deterministic lineId built from product id/name + options signature
  // This regenerates when you edit options, enabling merge-on-save
  const newLineIdFor = (l) => `${l?.id || l?.name || 'item'}::${optionKeyFor(l)}`;

  // Apply current edits:
  // 1) Recompute subtotal and regenerate lineId based on new options
  // 2) If an identical line already exists, merge quantities instead of duplicating
  // 3) Persist to storage, close modal
  const applyEdit = () => {
    if (!editing) return;
    const edited = { ...editing };
    edited.subtotal = lineSubtotal(edited);
    const newId = newLineIdFor(edited);

    // Find an existing line with the same newId (but not the same object reference)
    const existingIdx = lines.findIndex((x) => x.lineId === newId && x !== editing);

    let next;
    if (existingIdx >= 0) {
      // Merge quantities into the existing identical line
      next = lines
        .filter((x) => x.lineId !== editing.lineId)
        .map((x, i) =>
          i === existingIdx
            ? {
                ...x,
                qty: x.qty + edited.qty,
                subtotal: lineSubtotal({ ...x, qty: x.qty + edited.qty }),
              }
            : x
        );
    } else {
      // No identical line exists; replace the original with updated, new lineId
      edited.lineId = newId;
      next = lines.map((l) => (l.lineId === editing.lineId ? edited : l));
    }

    persist(next);
    setEditing(null);
  };

  // ——— Small UI Bits ———
  // Reusable pill-style option selector
  const Chip = ({ label, selected, onPress, subtle }) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: selected
          ? colors.accent
          : subtle
          ? colors.cardAlt
          : colors.chip,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
        marginRight: 8,
        marginBottom: 8,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={{
          color: selected ? '#fff' : colors.text,
          fontWeight: selected ? '700' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  // Section wrapper for grouped options in the edit modal
  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          color: colors.subtext,
          marginBottom: 8,
          fontWeight: '700',
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{children}</View>
    </View>
  );

  // ——— Render ———
  // Single cart line renderer for FlatList
  const renderLine = ({ item }) => {
    const unit = lineUnitPrice(item);
    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Product image or placeholder */}
        {item?.image ? (
          <Image
            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
            style={{ width: 64, height: 64, borderRadius: 12 }}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: colors.chip,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.subtext }}>IMG</Text>
          </View>
        )}

        {/* Description block */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>
            {item?.name ?? 'Item'}
          </Text>

          <Text style={{ color: colors.subtext, marginTop: 4 }}>
            {formatOptions(item) || 'Customise your drink'}
          </Text>

          {/* Price + Qty controls + Edit/Remove */}
          <View
            style={{
              marginTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {$(unit)} <Text style={{ color: colors.subtext }}>each</Text>
              </Text>
              <Text style={{ color: colors.text, marginTop: 2, fontWeight: '800' }}>
                Subtotal: {$(item.subtotal ?? 0)}
              </Text>
            </View>

            <View style={{ alignItems: 'center', gap: 6 }}>
              {/* Qty stepper */}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Pressable
                  onPress={() => dec(item.lineId)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.chip,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>−</Text>
                </Pressable>
                <Text style={{ color: colors.text, minWidth: 24, textAlign: 'center' }}>
                  {item.qty}
                </Text>
                <Pressable
                  onPress={() => inc(item.lineId)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.chip,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>+</Text>
                </Pressable>
              </View>

              {/* Edit / Remove actions */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable onPress={() => setEditing(item)}>
                  <Text style={{ color: colors.good, fontWeight: '700' }}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => removeLine(item.lineId)}>
                  <Text style={{ color: colors.danger, fontWeight: '700' }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Your Cart</Text>
        <Pressable
          onPress={clearCart}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: colors.cardAlt,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Clear all</Text>
        </Pressable>
      </View>

      {/* Lines list */}
      <FlatList
        data={lines}
        keyExtractor={(it) => it.lineId}
        renderItem={renderLine}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListEmptyComponent={
          <View style={{ paddingTop: 48, alignItems: 'center' }}>
            <Text style={{ color: colors.subtext }}>Your cart is empty.</Text>
          </View>
        }
      />

      {/* Footer / Total + Checkout CTA sticks to bottom */}
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: colors.subtext, fontSize: 16 }}>Total</Text>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
            {$(total)}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            if (!lines.length) {
              Alert.alert('Cart is empty', 'Add some items first.');
              return;
            }
            navigation.navigate('Checkout');
          }}
          style={{
            backgroundColor: colors.accent,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 0.3 }}>
            Proceed to Checkout
          </Text>
        </Pressable>
      </View>

      {/* ——— Edit Modal ——— */}
      {/* Bottom sheet-style modal to tweak options for a selected line.
          On save: recompute price, regenerate lineId, and merge duplicates. */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 16,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: '80%',
            }}
          >
            {/* Modal header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>
                Customise {editing?.name}
              </Text>
              <Pressable onPress={() => setEditing(null)}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Close</Text>
              </Pressable>
            </View>

            {/* Scrollable options */}
            <ScrollView
              style={{ marginTop: 8 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Temperature */}
              <Section title="Temperature">
                {['Hot', 'Warm', 'Iced', 'Extra Hot'].map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={editing?.options?.temperature === t}
                    onPress={() => setEditing((e) => setOpt(e, 'temperature', t))}
                  />
                ))}
              </Section>

              {/* Strength / Shots */}
              <Section title="Strength / Shots">
                {['Single', 'Double', 'Extra Strong'].map((s) => (
                  <Chip
                    key={s}
                    label={`${s}${STRENGTH_PRICE[s] ? ` +$${STRENGTH_PRICE[s].toFixed(2)}` : ''}`}
                    selected={editing?.options?.strength === s}
                    onPress={() => setEditing((e) => setOpt(e, 'strength', s))}
                  />
                ))}
              </Section>

              {/* Foam / Cream */}
              <Section title="Foam / Cream">
                {['No Foam', 'Light Foam', 'Extra Foam', 'Creamy'].map((f) => (
                  <Chip
                    key={f}
                    label={`${f}${FOAM_PRICE[f] ? ` +$${FOAM_PRICE[f].toFixed(2)}` : ''}`}
                    selected={editing?.options?.foam === f}
                    onPress={() => setEditing((e) => setOpt(e, 'foam', f))}
                  />
                ))}
              </Section>

              {/* Sweetener */}
              <Section title="Sweetener">
                {['None', 'Sugar', 'Brown Sugar', 'Honey', 'Stevia'].map((sw) => (
                  <Chip
                    key={sw}
                    label={sw}
                    selected={editing?.options?.sweetener === sw}
                    onPress={() => setEditing((e) => setOpt(e, 'sweetener', sw))}
                  />
                ))}
              </Section>

              {/* Milk Alternatives */}
              <Section title="Milk">
                {['Whole', 'Trim', 'Oat', 'Almond', 'Soy'].map((m) => (
                  <Chip
                    key={m}
                    label={`${m}${MILK_PRICE[m] ? ` +$${MILK_PRICE[m].toFixed(2)}` : ''}`}
                    selected={editing?.options?.milk === m}
                    onPress={() => setEditing((e) => setOpt(e, 'milk', m))}
                  />
                ))}
              </Section>

              {/* Dessert-style Toppings */}
              <Section title="Toppings">
                {TOPPINGS.map((t) => (
                  <Chip
                    key={t.key}
                    label={`${t.key} +$${t.price.toFixed(2)}`}
                    selected={editing?.options?.toppings?.includes(t.key)}
                    onPress={() => setEditing((e) => toggleTopping(e, t.key))}
                  />
                ))}
              </Section>

              {/* Live price preview based on editing state */}
              <View
                style={{
                  backgroundColor: colors.cardAlt,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: 4,
                }}
              >
                <Text style={{ color: colors.subtext }}>
                  Price per item (incl. add-ons)
                </Text>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
                  {$(editing ? lineUnitPrice(editing) : 0)}
                </Text>
              </View>

              {/* Save changes -> triggers merge logic if an identical line exists */}
              <Pressable
                onPress={applyEdit}
                style={{
                  marginTop: 14,
                  backgroundColor: colors.accent,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Save Changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
