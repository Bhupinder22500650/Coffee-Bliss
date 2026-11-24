import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MAX_QUANTITY } from '../data/options';
import { colors, styles } from '../theme';

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
  disabled = false,
}) {
  const latest = useRef();
  latest.current = { value, onChange, min, max, disabled };
  const hold = useRef({ delay: null, interval: null, repeated: false });
  const stop = useCallback(() => {
    clearTimeout(hold.current.delay);
    clearInterval(hold.current.interval);
  }, []);
  useEffect(() => stop, [stop]);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const step = useCallback(
    (delta) => {
      const current = latest.current;
      if (current.disabled) return;
      const next = Math.max(current.min, Math.min(current.max, current.value + delta));
      if (next === current.value) {
        stop();
        return;
      }
      current.value = next;
      current.onChange(next);
    },
    [stop],
  );

  const start = (delta) => {
    stop();
    hold.current.repeated = false;
    hold.current.delay = setTimeout(() => {
      hold.current.repeated = true;
      step(delta);
      hold.current.interval = setInterval(() => step(delta), 100);
    }, 350);
  };

  return (
    <View style={[styles.row, { justifyContent: 'flex-start' }]}>
      {[
        [-1, 'Decrease quantity', '−'],
        [1, 'Increase quantity', '+'],
      ].map(([delta, label, symbol], index) => (
        <React.Fragment key={label}>
          {index === 1 && (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Quantity ${value}`}
              style={[styles.heading, { minWidth: 36, textAlign: 'center' }]}
            >
              {value}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            aria-disabled={disabled || (delta < 0 ? value <= min : value >= max)}
            disabled={disabled || (delta < 0 ? value <= min : value >= max)}
            accessibilityState={{
              disabled: disabled || (delta < 0 ? value <= min : value >= max),
            }}
            onPressIn={() => start(delta)}
            onPressOut={stop}
            onPress={() => {
              if (!hold.current.repeated) step(delta);
              hold.current.repeated = false;
            }}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity:
                disabled || (delta < 0 ? value <= min : value >= max) ? 0.4 : pressed ? 0.7 : 1,
            })}
          >
            <Text style={styles.heading}>{symbol}</Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}
