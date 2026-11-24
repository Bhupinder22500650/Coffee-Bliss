import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, styles } from '../theme';
import { formatMoney } from '../utils/pricing';

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
  loading = false,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondary,
        (disabled || loading) && ui.disabled,
        pressed && ui.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : colors.onAccent} />
      ) : (
        <Text
          style={[
            ui.buttonText,
            secondary && { color: colors.text },
            danger && { color: colors.danger },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Notice({ children, onDismiss, error = false }) {
  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      style={[ui.notice, error && { borderColor: colors.danger }]}
    >
      <Text style={[styles.muted, error && { color: colors.danger }]}>{children}</Text>
      {onDismiss && <Button title="Dismiss" onPress={onDismiss} secondary />}
    </View>
  );
}

export function Screen({ children, scroll = true, header = false, contentStyle, style }) {
  const { error, clearError } = useApp();
  const content = (
    <>
      {error ? (
        <Notice error onDismiss={clearError}>
          {error}
        </Notice>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView
      edges={header ? ['left', 'right', 'bottom'] : ['top', 'left', 'right']}
      style={[styles.page, style]}
    >
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, contentStyle]}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }, contentStyle]}>{content}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function EmptyState({ title, message, children }) {
  return (
    <View style={ui.empty}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
      {children}
    </View>
  );
}

export function Totals({ subtotalCents, gstCents, totalCents }) {
  return (
    <View style={{ gap: 10 }}>
      {[
        ['Subtotal', subtotalCents],
        ['GST (15%)', gstCents],
        ['Total', totalCents],
      ].map(([label, amount]) => (
        <View key={label} style={styles.row}>
          <Text style={label === 'Total' ? styles.heading : styles.muted}>{label}</Text>
          <Text style={label === 'Total' ? styles.heading : styles.text}>
            {formatMoney(amount)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}) {
  const { error } = useApp();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onCancel}
    >
      <View style={ui.backdrop}>
        <View accessibilityViewIsModal style={[styles.card, ui.dialog]}>
          <Text accessibilityRole="header" style={styles.heading}>
            {title}
          </Text>
          <Text style={styles.muted}>{message}</Text>
          {error ? (
            <Text accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
          <Button title={confirmLabel} onPress={onConfirm} loading={busy} />
          <Button title="Cancel" onPress={onCancel} disabled={busy} secondary />
        </View>
      </View>
    </Modal>
  );
}

const ui = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  notice: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 10 },
  empty: { paddingVertical: 24, gap: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: '#0009',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: { width: '100%', maxWidth: 440, gap: 16 },
});
