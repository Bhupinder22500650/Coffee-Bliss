// src/components/CoffeeCard.js
// =============================================
// ☕ CoffeeCard Component
// Displays a single coffee item (name, price, and tap hint)
// Used in the menu list to navigate to the details screen
// =============================================

import React from 'react';
import { View, Text, Pressable } from 'react-native';

// ---------------------------------------------
// Props:
// • item: coffee object (name, price, etc.)
// • onPress: function triggered when user taps the card
// ---------------------------------------------
export default function CoffeeCard({ item, onPress }) {
  return (
    // Pressable makes the entire card tappable
    <Pressable
      onPress={onPress} // triggers when tapped
      style={{
        backgroundColor: '#fff',   // white card background
        padding: 14,               // inner spacing
        borderRadius: 12,          // rounded corners
        marginBottom: 12,          // space between cards
        shadowColor: '#000',       // subtle drop shadow
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }}
    >
      {/* Coffee name */}
      <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.name}</Text>

      {/* Price formatted to 2 decimals */}
      <Text style={{ color: '#7a7a7a', marginTop: 4 }}>
        ${item.price.toFixed(2)}
      </Text>

      {/* Hint for the user */}
      <Text style={{ color: '#9a9a9a', marginTop: 6 }}>
        Tap to customise →
      </Text>
    </Pressable>
  );
}
