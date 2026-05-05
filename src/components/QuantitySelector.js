// src/components/QuantitySelector.js
// =====================================================
// QuantitySelector
// - Reusable control for increasing/decreasing a number
// - Press once to step by 1, or press-and-hold to auto-repeat
// - Light haptics on each change for tactile feedback
// - Accessible labels for screen readers
// =====================================================

import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function QuantitySelector({
  // Current quantity value (controlled by parent)
  qty,
  // Setter provided by parent to update the quantity
  setQty,
  // Optional callback for consumers/tests that prefer a change event
  onChange, // <-- optional

  // Guard rails
  min = 1,           // Minimum allowed quantity
  max = 99,          // Maximum allowed quantity

  // Visual density of the control
  size = 'md',       // 'sm' | 'md' | 'lg'

  // Theming (defaults match Coffee Bliss dark palette)
  colors = {
    bg: '#3B302C',
    text: '#F6F1EE',
    subtext: '#DCCFC9',
    accent: '#C67C4E',
    border: '#5A4943',
  },

  // Disable interaction
  disabled = false,
}) {
  // ---------- sizing ----------
  const dims = {
    sm: { h: 34, w: 36, fs: 14, fsQty: 14, padX: 10, gap: 8, radius: 10 },
    md: { h: 42, w: 44, fs: 16, fsQty: 16, padX: 12, gap: 10, radius: 12 },
    lg: { h: 52, w: 56, fs: 18, fsQty: 18, padX: 14, gap: 12, radius: 14 },
  }[size] ?? dims?.md;

  // ---------- helpers ----------
  const clamp = useCallback((v) => Math.max(min, Math.min(max, v)), [min, max]);

  const vibrate = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // haptics can fail in simulators — ignore
    }
  }, []);

  // Update helper: supports either setQty (state setter) or onChange (callback)
  const update = useCallback((next) => {
    if (typeof setQty === 'function') setQty(next);
    if (typeof onChange === 'function') onChange(next);
  }, [setQty, onChange]);

  // ---------- actions ----------
  const inc = useCallback(() => {
    if (disabled) return;
    if (qty >= max) return;
    vibrate();
    update(clamp(qty + 1));
  }, [qty, max, clamp, update, vibrate, disabled]);

  const dec = useCallback(() => {
    if (disabled) return;
    if (qty <= min) return;
    vibrate();
    update(clamp(qty - 1));
  }, [qty, min, clamp, update, vibrate, disabled]);

  // ---------- press-and-hold (auto-repeat) ----------
  const holdRef = useRef({ timer: null, interval: null, mode: null });

  const clearHold = useCallback(() => {
    if (holdRef.current.timer) {
      clearTimeout(holdRef.current.timer);
      holdRef.current.timer = null;
    }
    if (holdRef.current.interval) {
      clearInterval(holdRef.current.interval);
      holdRef.current.interval = null;
    }
    holdRef.current.mode = null;
  }, []);

  const startHold = useCallback((mode) => {
    if (disabled) return;
    holdRef.current.mode = mode; // 'inc' | 'dec'
    // initial delay then fast repeat
    holdRef.current.timer = setTimeout(() => {
      holdRef.current.interval = setInterval(() => {
        if (holdRef.current.mode === 'inc') inc();
        else dec();
      }, 90); // repeat rate
    }, 350); // long-press threshold
  }, [inc, dec, disabled]);

  useEffect(() => clearHold, [clearHold]);

  // ---------- render ----------
  const btnBase = {
    height: dims.h,
    width: dims.w,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dims.radius,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: disabled ? 0.6 : 1,
  };

  const textStyle = {
    color: colors.text,
    fontSize: dims.fs,
    fontWeight: '700',
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: dims.gap,
        paddingHorizontal: dims.padX,
      }}
      accessibilityRole="adjustable"
      accessibilityLabel="Quantity selector"
      accessibilityValue={{ text: String(qty) }}
      accessibilityHint="Swipe up or down or use buttons to change quantity"
    >
      <Pressable
        onPress={dec}
        onPressIn={() => startHold('dec')}
        onPressOut={clearHold}
        disabled={disabled || qty <= min}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        style={({ pressed }) => [
          btnBase,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={textStyle}>–</Text>
      </Pressable>

      <View
        style={{
          minWidth: 36,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: dims.fsQty,
            fontWeight: '700',
          }}
          accessibilityLabel={`Quantity ${qty}`}
        >
          {qty}
        </Text>
        <Text
          style={{
            color: colors.subtext,
            fontSize: dims.fsQty - 6,
            marginTop: 2,
          }}
        >
          items
        </Text>
      </View>

      <Pressable
        onPress={inc}
        onPressIn={() => startHold('inc')}
        onPressOut={clearHold}
        disabled={disabled || qty >= max}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        style={({ pressed }) => [
          btnBase,
          { backgroundColor: colors.accent, borderColor: colors.accent },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={[textStyle, { color: '#201A18' }]}>+</Text>
      </Pressable>
    </View>
  );
}
