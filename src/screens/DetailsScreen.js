// ================================================
// File: src/screens/DetailsScreen.js
// Coffee Bliss — Product details with FULL customisation
// Pairs with the polished CartScreen edit options (temperature/strength/foam/sweetener/milk/toppings)
// Compatible with QuantitySelector APIs: (qty,setQty) or (value,onChange)
// =================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import QuantitySelector from '../components/QuantitySelector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { keyFor } from '../utils/storageKeys';

export default function DetailsScreen({ route, navigation }) {
  // ——— Theme ———
  // Matches Cart/Checkout to keep a consistent look & feel and make tweaks easy.
  const colors = {
    background: '#201A18',
    header: '#2B2320',
    chip: '#3B302C',
    card: '#4E3E38',
    cardAlt: '#3F332F',
    border: '#3A2E2A',
    text: '#F6F1EE',
    subtext: '#DCCFC9',
    accent: '#C67C4E',
    danger: '#FFB4A2',
  };

  // The product passed from the previous screen (id, name, image, price, desc)
  const { item } = route.params;

  // Per-user storage isolation (prevents carts mixing between users)
  const { user } = useAuth();
  const CART_KEY = keyFor('cb_cart', user);

  // ——— Pricing model (kept in sync with Cart & Checkout) ———
  // Any change here should be mirrored there to avoid price drift.
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

  // ——— Local state ———
  // UI selections; these map 1:1 to Cart options so merging works later.
  const [size, setSize] = useState('M');               // S | M | L
  const [temperature, setTemperature] = useState('Hot'); // Hot | Warm | Iced | Extra Hot
  const [strength, setStrength] = useState('Single');    // Single | Double | Extra Strong
  const [foam, setFoam] = useState('Light Foam');        // No Foam | Light Foam | Extra Foam | Creamy
  const [sweetener, setSweetener] = useState('None');    // None | Sugar | Brown Sugar | Honey | Stevia
  const [milk, setMilk] = useState('Whole');             // Whole | Trim | Oat | Almond | Soy
  const [toppings, setToppings] = useState([]);          // array of TOPPINGS keys
  const [qty, setQty] = useState(1);                     // quantity to add

  // Small currency helper
  const $ = (n) => `$${Number(n).toFixed(2)}`;

  // Size delta recomputed only when 'size' changes
  const sizePriceDelta = useMemo(
    () => (size === 'L' ? 1.0 : size === 'S' ? -0.5 : 0),
    [size]
  );

  // Sum of all add-on costs (shots, milk, foam, toppings)
  // Memoised to avoid unnecessary recalcs while typing/scrolling.
  const addOnsPrice = useMemo(() => {
    const t = toppings.reduce(
      (sum, k) => sum + (TOPPINGS.find((x) => x.key === k)?.price || 0),
      0
    );
    return (STRENGTH_PRICE[strength] || 0)
      + (MILK_PRICE[milk] || 0)
      + (FOAM_PRICE[foam] || 0)
      + t;
  }, [toppings, strength, milk, foam]);

  // Unit price = base + size delta + add-ons (never persisted, always recomputed)
  // Using base item.price here prevents double-counting later in Cart/Checkout.
  const unitPrice = useMemo(() => {
    const base = Number(item?.price ?? 0);
    return +(Math.max(0, base + sizePriceDelta + addOnsPrice)).toFixed(2);
  }, [item?.price, sizePriceDelta, addOnsPrice]);

  // Toggle a topping key in/out of the selected set (order-independent)
  const toggleTopping = (k) => {
    setToppings((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  // Small reusable chip for option selections
  const Chip = ({ label, selected, onPress, subtle }) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: selected ? colors.accent : subtle ? colors.cardAlt : colors.chip,
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

  // Section wrapper to label option groups in a consistent layout
  const Section = ({ title, children }) => (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{children}</View>
    </View>
  );

  // ——— Add to Cart ———
  // 1) Build an options object aligned with Cart/Checkout.
  // 2) Generate a deterministic lineId based on product + options.
  // 3) If the same line already exists, merge qty; else push a new entry.
  // 4) Persist to AsyncStorage and navigate to Cart.
  const addToCart = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const cartStr = await AsyncStorage.getItem(CART_KEY);
      const cart = cartStr ? JSON.parse(cartStr) : [];

      // Options payload must match Cart/Checkout schema for pricing + merge to work.
      const options = { temperature, strength, foam, sweetener, milk, toppings };

      // Stable identity string (sort toppings so order doesn't create duplicates).
      const optionKey = [
        size,
        temperature,
        strength,
        foam,
        sweetener,
        milk,
        [...toppings].sort().join('+'),
      ].join('|');

      const lineId = `${item?.id || item?.name || 'item'}::${optionKey}`;

      // Merge if identical configuration already in cart
      const existingIndex = cart.findIndex((c) => c.lineId === lineId);
      if (existingIndex >= 0) {
        cart[existingIndex].qty += qty;
        // Keep subtotal consistent with stored unit (cart[existingIndex].price)
        cart[existingIndex].subtotal = +(
          cart[existingIndex].qty * cart[existingIndex].price
        ).toFixed(2);
      } else {
        // Push a fully-specified line; store basePrice to allow safe recompute later
        cart.push({
          lineId,
          id: item?.id ?? null,
          name: item?.name ?? 'Coffee',
          image: item?.image ?? null,
          price: Number(unitPrice),            // the current unit price incl. add-ons
          basePrice: Number(item?.price ?? 0), // original menu price for recompute
          size,
          options,
          qty,
          subtotal: +(unitPrice * qty).toFixed(2),
        });
      }

      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
      Alert.alert('Added to cart', `${item?.name ?? 'Item'} ×${qty} (${size})`);
      navigation.navigate('Cart');
    } catch (e) {
      console.warn('addToCart error', e);
      Alert.alert('Oops', 'Could not add to cart. Please try again.');
    }
  };

  // ——— Render ———
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Hero image (optional) */}
        {item?.image ? (
          <Image
            source={typeof item.image === 'string' ? { uri: item.image } : item.image}
            style={{ width: '100%', height: 260, borderRadius: 16, marginBottom: 16 }}
            resizeMode="cover"
          />
        ) : null}

        {/* Title + description */}
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>
          {item?.name ?? 'Coffee'}
        </Text>
        <Text style={{ color: colors.subtext, marginTop: 6 }}>
          {item?.desc ?? 'Freshly brewed specialty coffee.'}
        </Text>

        {/* Customisation card */}
        <View
          style={{
            marginTop: 16,
            padding: 14,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Size */}
          <Section title="Size">
            {['S', 'M', 'L'].map((s) => (
              <Chip key={s} label={s} selected={size === s} onPress={() => setSize(s)} />
            ))}
          </Section>

          {/* Temperature */}
          <Section title="Temperature">
            {['Hot', 'Warm', 'Iced', 'Extra Hot'].map((t) => (
              <Chip key={t} label={t} selected={temperature === t} onPress={() => setTemperature(t)} />
            ))}
          </Section>

          {/* Strength / Shots */}
          <Section title="Strength / Shots">
            {['Single', 'Double', 'Extra Strong'].map((s) => (
              <Chip
                key={s}
                label={`${s}${STRENGTH_PRICE[s] ? ` +$${STRENGTH_PRICE[s].toFixed(2)}` : ''}`}
                selected={strength === s}
                onPress={() => setStrength(s)}
              />
            ))}
          </Section>

          {/* Foam / Cream */}
          <Section title="Foam / Cream">
            {['No Foam', 'Light Foam', 'Extra Foam', 'Creamy'].map((f) => (
              <Chip
                key={f}
                label={`${f}${FOAM_PRICE[f] ? ` +$${FOAM_PRICE[f].toFixed(2)}` : ''}`}
                selected={foam === f}
                onPress={() => setFoam(f)}
              />
            ))}
          </Section>

          {/* Sweetener */}
          <Section title="Sweetener">
            {['None', 'Sugar', 'Brown Sugar', 'Honey', 'Stevia'].map((sw) => (
              <Chip key={sw} label={sw} selected={sweetener === sw} onPress={() => setSweetener(sw)} />
            ))}
          </Section>

          {/* Milk */}
          <Section title="Milk">
            {['Whole', 'Trim', 'Oat', 'Almond', 'Soy'].map((m) => (
              <Chip
                key={m}
                label={`${m}${MILK_PRICE[m] ? ` +$${MILK_PRICE[m].toFixed(2)}` : ''}`}
                selected={milk === m}
                onPress={() => setMilk(m)}
              />
            ))}
          </Section>

          {/* Toppings */}
          <Section title="Toppings">
            {TOPPINGS.map((t) => (
              <Chip
                key={t.key}
                label={`${t.key} +$${t.price.toFixed(2)}`}
                selected={toppings.includes(t.key)}
                onPress={() => toggleTopping(t.key)}
                subtle
              />
            ))}
          </Section>
        </View>

        {/* Qty + Live unit price */}
        <View
          style={{
            marginTop: 16,
            padding: 14,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
          }}
        >
          {/* QuantitySelector supports both (qty,setQty) and (value,onChange) props */}
          <QuantitySelector qty={qty} setQty={setQty} value={qty} onChange={setQty} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.subtext }}>Price per item</Text>
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>
              {$(unitPrice)}
            </Text>
          </View>
        </View>

        {/* Add-to-cart CTA; total reflects qty to reduce surprises */}
        <Pressable
          onPress={addToCart}
          style={{
            marginTop: 18,
            backgroundColor: colors.accent,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            Add to Cart • {$(unitPrice * qty)}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
