import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from '../theme';
import { formatMoney } from '../utils/pricing';

export default function CoffeeCard({ item, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Customize ${item.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
    >
      <Text style={styles.heading}>{item.name}</Text>
      <Text style={styles.muted}>{item.description}</Text>
      <Text style={styles.text}>{formatMoney(item.priceCents)} · Customize</Text>
    </Pressable>
  );
}
