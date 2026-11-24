import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { OPTION_GROUPS, TOPPINGS } from '../data/options';
import { formatMoney } from '../utils/pricing';
import { colors, styles } from '../theme';

function Choice({ label, price, checked, multiple = false, onPress, disabled }) {
  const adjustment = price ? ` ${price > 0 ? '+' : '−'}${formatMoney(Math.abs(price))}` : '';
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={`${label}${adjustment}`}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: checked ? colors.accent : colors.border,
        backgroundColor: checked ? colors.accent : colors.surface,
      }}
    >
      <Text
        style={{
          color: checked ? colors.onAccent : colors.text,
          fontWeight: checked ? '700' : '400',
        }}
      >
        {label}
        {adjustment}
      </Text>
    </Pressable>
  );
}

export default function SelectionForm({ value, onChange, disabled = false }) {
  return (
    <View style={{ gap: 20 }}>
      {OPTION_GROUPS.map((group) => (
        <View key={group.key} style={{ gap: 10 }}>
          <Text style={styles.label}>{group.label}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={group.label} style={styles.wrap}>
            {group.choices.map(([label, price]) => (
              <Choice
                key={label}
                label={label}
                price={price}
                checked={value[group.key] === label}
                disabled={disabled}
                onPress={() => onChange({ ...value, [group.key]: label })}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={{ gap: 10 }}>
        <Text style={styles.label}>Toppings (optional)</Text>
        <View style={styles.wrap}>
          {TOPPINGS.map(([label, price]) => (
            <Choice
              key={label}
              label={label}
              price={price}
              multiple
              disabled={disabled}
              checked={value.toppings.includes(label)}
              onPress={() =>
                onChange({
                  ...value,
                  toppings: value.toppings.includes(label)
                    ? value.toppings.filter((item) => item !== label)
                    : [...value.toppings, label],
                })
              }
            />
          ))}
        </View>
      </View>
    </View>
  );
}
