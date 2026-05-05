// src/screens/ProfileScreen.js
// ===============================================
// Profile Screen – Coffee Bliss (minimal version)
// Shows user info, shopping shortcuts, and logout
// Removed: Loyalty, Change Password, Notifications, Help
// ===============================================

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

// -----------------------------------------------
// 🎨 Coffee-dark palette (shared across the app)
// -----------------------------------------------
const colors = {
  background: '#201A18',
  header: '#2B2320',
  chip: '#3B302C',
  card: '#4E3E38',
  border: '#3A2E2A',
  text: '#F6F1EE',
  subtext: '#DCCFC9',
  accent: '#C67C4E',
  accentText: '#1B0F0A',
};

// ===============================================
// 🧍 Profile Screen Component
// ===============================================
export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth(); // user info + logout handler

  // -----------------------------------------------
  // 🪪 Display name (prefer name, fall back to email prefix)
  // -----------------------------------------------
  const displayName = useMemo(() => {
    const n = user?.name?.trim();
    if (n) return n;
    const e = user?.email || '';
    return e.split('@')[0] || 'User';
  }, [user?.name, user?.email]);

  // -----------------------------------------------
  // 🧢 Initials from name or email
  // -----------------------------------------------
  const initials = useMemo(() => {
    const fromName = (user?.name || '')
      .split(' ')
      .filter(Boolean)
      .map(s => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    if (fromName) return fromName;
    const e = user?.email || '';
    const base = e.split('@')[0] || 'U';
    return base.replace(/[\W_]+/g, '').slice(0, 1).toUpperCase() || 'U';
  }, [user?.name, user?.email]);

  // -----------------------------------------------
  // 📳 Light haptic feedback
  // -----------------------------------------------
  const vibrate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // -----------------------------------------------
  // 🚪 Confirm Logout
  // -----------------------------------------------
  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // -----------------------------------------------
  // 📦 Small layout helpers
  // -----------------------------------------------
  const SectionHeader = ({ label }) => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      <Text style={{ color: colors.subtext, fontSize: 12, letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );

  const Card = ({ children, style }) => (
    <View
      style={[
        {
          marginHorizontal: 16,
          marginTop: 8,
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  // -----------------------------------------------
  // 📋 Reusable list row (icon + title + optional subtitle)
  // -----------------------------------------------
  const Row = ({ title, subtitle, icon, onPress, right, disabled }) => (
    <Pressable
      onPress={disabled ? undefined : onPress}
      android_ripple={{ color: '#00000022' }}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Left icon chip */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.chip,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {icon}
      </View>

      {/* Texts */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
        {!!subtitle && (
          <Text style={{ color: colors.subtext, marginTop: 2, fontSize: 12 }}>{subtitle}</Text>
        )}
      </View>

      {/* Right chevron (no switches in this minimal version) */}
      {right ? right : <Ionicons name="chevron-forward" size={18} color={colors.subtext} />}
    </Pressable>
  );

  // ===============================================
  // 🧾 UI Rendering
  // ===============================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* -------------------------------------------
          🧭 Header
      ------------------------------------------- */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.header,
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: '900', color: colors.text }}>Profile</Text>
        <Text style={{ color: colors.subtext, marginTop: 4 }}>Manage your account</Text>
      </View>

      {/* -------------------------------------------
          👤 User info card (avatar + name + email)
      ------------------------------------------- */}
      <Card style={{ marginTop: 16 }}>
        <View
          style={{
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Avatar with accent ring */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.chip,
              borderWidth: 2,
              borderColor: colors.accent,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22 }}>{initials}</Text>
          </View>

          {/* Name + email */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{displayName}</Text>
            <Text style={{ color: colors.subtext, marginTop: 2, fontSize: 12 }}>
              {user?.email || 'Signed in to Coffee Bliss'}
            </Text>
          </View>
        </View>
      </Card>

      {/* -------------------------------------------
          🛍️ Shopping shortcuts (Menu + Cart)
      ------------------------------------------- */}
      <SectionHeader label="SHOPPING" />
      <Card>
        <Row
          title="Browse Menu"
          subtitle="See our latest brews"
          icon={<Ionicons name="cafe" size={18} color={colors.accent} />}
          onPress={() => {
            vibrate();
            navigation.navigate('Tabs', { screen: 'Home' });
          }}
        />
        <Row
          title="Open Cart"
          subtitle="Review your selections"
          icon={<Ionicons name="cart-outline" size={18} color={colors.text} />}
          onPress={() => {
            vibrate();
            navigation.navigate('Tabs', { screen: 'Cart' });
          }}
        />
      </Card>

      {/* -------------------------------------------
          🔓 Logout
      ------------------------------------------- */}
      <View style={{ marginTop: 16, marginHorizontal: 16 }}>
        <Pressable
          onPress={() => {
            vibrate();
            confirmLogout();
          }}
          android_ripple={{ color: '#00000022', borderless: false }}
          style={{
            backgroundColor: colors.accent,
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#9a5a36',
          }}
        >
          <Text style={{ color: colors.accentText, fontWeight: '900' }}>Logout</Text>
        </Pressable>
      </View>

      {/* -------------------------------------------
          🧾 Footer
      ------------------------------------------- */}
      <View style={{ alignItems: 'center,', marginTop: 12, marginBottom: 16 }}>
        <Text style={{ color: colors.subtext, fontSize: 12 }}>
          Coffee Bliss • v1.0.0 (demo)
        </Text>
      </View>
    </SafeAreaView>
  );
}
