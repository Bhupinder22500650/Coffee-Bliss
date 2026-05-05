// =============================================================
// File: src/screens/LoginScreen.js
// Coffee Bliss — Email/Password login with:
// • Inline validation + error messaging
// • "Remember me" using AsyncStorage (stores last email only)
// • Haptics on key interactions
// • Per-user navigation handled by AuthContext (App.js switches to Tabs)
// Design matches the app’s coffee theme.
// =============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const LAST_EMAIL_KEY = 'cb_last_email'; // storage key for "remember me" (email only)

export default function LoginScreen({ navigation }) {
  // ——— Theme ———
  // Central palette so colours are consistent with Home/Details/Cart/Profile.
  const colors = {
    background: '#201A18',
    header: '#2B2320',
    chip: '#3B302C',
    card: '#4E3E38',
    border: '#3A2E2A',
    text: '#F6F1EE',
    subtext: '#DCCFC9',
    accent: '#C67C4E',
  };

  // ——— Local UI state ———
  const [email, setEmail] = useState('');        // controlled input
  const [password, setPassword] = useState('');  // controlled input
  const [showPwd, setShowPwd] = useState(false); // toggles secureTextEntry
  const [remember, setRemember] = useState(true); // persist last email locally
  const [error, setError] = useState('');        // inline validation message
  
  // ——— Animation state ———
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  // Auth API from context (abstracts real auth provider)
  const { login } = useAuth();

  // ——— Prefill last email (Remember Me) ———
  // On mount: read LAST_EMAIL_KEY; if present, pre-populate email field.
  useEffect(() => {
    (async () => {
      const last = await AsyncStorage.getItem(LAST_EMAIL_KEY);
      if (last) setEmail(last);
    })();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Basic client-side validation; keeps UX responsive before calling auth.
  const validate = () => {
    const e = email.trim();
    if (!e || !password) {
      setError('Please enter your email and password.');
      return false;
    }
    const okEmail = /\S+@\S+\.\S+/.test(e);
    if (!okEmail) {
      setError('Enter a valid email address (e.g., you@example.com).');
      return false;
    }
    setError('');
    return true;
  };

  // ——— Submit flow ———
  // 1) Validate
  // 2) Call AuthContext.login(email, password)
  // 3) On success: optionally store last email, let App.js react to auth state
  // 4) On failure: haptic error + alert
  const onLogin = async () => {
    if (!validate()) return;

    const ok = await login(email.trim(), password);
    if (!ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Login failed',
        'Email or password is incorrect, or this email is not registered.'
      );
    } else {
      if (remember) {
        await AsyncStorage.setItem(LAST_EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }
      // On success, AuthContext sets user; App.js navigates to the main tabs.
      Haptics.selectionAsync();
      return; // no manual navigation here — centralised in App.js based on auth
    }
  };

  // Shared styles for text inputs
  const inputContainer = {
    backgroundColor: colors.chip,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  };

  const inputStyle = {
    color: colors.text,
    flex: 1,
    paddingVertical: 2,
    marginLeft: 8,
  };

  // Disable CTA if fields are empty (UX hint + prevents accidental submits)
  const disabled = !email.trim() || !password;

  // ——— Render ———
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Keeps inputs visible when keyboard opens (esp. on iOS) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          {/* Brand header with Animated Logo */}
          <Animated.View
            style={{
              alignItems: 'center',
              marginBottom: 18,
              paddingBottom: 10,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: floatAnim }
              ]
            }}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 140, height: 140, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>
              Coffee Bliss
            </Text>
            <Text style={{ color: colors.subtext, marginTop: 4 }}>
              Sign in to order your coffee
            </Text>
          </Animated.View>

          {/* Email field */}
          <Text style={{ color: colors.subtext, marginBottom: 6, fontWeight: '600' }}>
            Email
          </Text>
          <View style={inputContainer}>
            <Ionicons name="mail-outline" size={18} color={colors.subtext} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
              returnKeyType="next"
            />
          </View>

          {/* Password field */}
          <Text
            style={{
              color: colors.subtext,
              marginTop: 12,
              marginBottom: 6,
              fontWeight: '600',
            }}
          >
            Password
          </Text>
          <View style={inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.subtext} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showPwd}
              style={inputStyle}
              returnKeyType="go"
              onSubmitEditing={onLogin} // allows pressing enter to submit
            />
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowPwd((s) => !s);
              }}
              style={{ padding: 6, marginLeft: 6 }}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {showPwd ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>

          {/* Inline error/help text
             - shows validation message in a contrasting colour when needed */}
          <Text style={{ color: error ? '#FFB4A9' : colors.subtext, marginTop: 8 }}>
            {error || 'Use your registered email & password.'}
          </Text>

          {/* Remember me + Forgot password link */}
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Custom checkbox with haptic selection */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setRemember((r) => !r);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  backgroundColor: remember ? colors.accent : 'transparent',
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {remember ? (
                  <Ionicons name="checkmark" size={14} color="#1B0F0A" />
                ) : null}
              </View>
              <Text style={{ color: colors.subtext, fontWeight: '600' }}>
                Remember me
              </Text>
            </Pressable>

            {/* Navigates to password reset screen (email-based flow) */}
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Login CTA (disabled until both fields have values) */}
          <Pressable
            onPress={onLogin}
            disabled={disabled}
            style={{
              backgroundColor: colors.accent,
              padding: 14,
              borderRadius: 14,
              alignItems: 'center',
              marginTop: 16,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#1B0F0A', fontWeight: '900' }}>Login</Text>
          </Pressable>

          {/* Divider-ish spacing */}
          <View style={{ height: 8 }} />

          {/* Link to Signup for new users */}
          <Pressable
            onPress={() => navigation.navigate('Signup')}
            style={{ alignSelf: 'center', marginTop: 8 }}
          >
            <Text style={{ color: colors.subtext }}>
              New here?{' '}
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                Create an account
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
