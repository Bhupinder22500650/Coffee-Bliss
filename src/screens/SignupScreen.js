// =============================================================
// File: src/screens/SignupScreen.js
// Coffee Bliss — Email/Password signup with:
// • Client-side validation (email format, min length, match)
// • Haptics on important interactions
// • No auto-login; user is redirected to Login on success
// Works with AuthContext.register(name, email, password).
// =============================================================

import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';

export default function SignupScreen({ navigation }) {
  // ——— Theme ———
  // Matches Login/Home/etc. so the UI is consistent and easy to tweak in one place.
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

  // ——— Auth API ———
  // register(name, email, password) provided by AuthContext (abstracts real backend)
  const { register } = useAuth();

  // ——— Local UI state ———
  const [name, setName] = useState('');     // optional display name
  const [email, setEmail] = useState('');   // required
  const [pwd, setPwd] = useState('');       // required (min 6)
  const [pwd2, setPwd2] = useState('');     // confirmation
  const [showPwd, setShowPwd] = useState(false); // toggles secureTextEntry
  const [error, setError] = useState('');   // inline error/help text

  // Shared input container style
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

  // Shared input text style
  const inputStyle = {
    color: colors.text,
    flex: 1,
    paddingVertical: 2,
    marginLeft: 8,
  };

  // ——— Client-side validation ———
  // Lightweight checks for better UX before calling register():
  //  - All required fields present
  //  - Email shape looks valid
  //  - Password length >= 6
  //  - Passwords match
  const validate = () => {
    const e = email.trim();
    if (!e || !pwd || !pwd2) {
      setError('Please fill all required fields.');
      return false;
    }
    const okEmail = /\S+@\S+\.\S+/.test(e);
    if (!okEmail) {
      setError('Enter a valid email address (e.g., you@example.com).');
      return false;
    }
    if (pwd.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (pwd !== pwd2) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  // ——— Submit flow ———
  // 1) Validate inputs
  // 2) Call register(name, email, password)
  // 3) On error: haptic + alert
  // 4) On success: prompt user and redirect to Login (no auto-login)
  const onSignup = async () => {
    if (!validate()) return;
    const res = await register(name.trim(), email.trim(), pwd);
    if (!res.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Sign up failed', res.error || 'Please try again.');
      return;
    }
    Haptics.selectionAsync();
    Alert.alert('Account created', 'Please login with your new credentials.');
    navigation.replace('Login'); // explicit login flow keeps UX simple for the demo
  };

  // Disable CTA if required fields are empty (visual hint + guards accidental taps)
  const disabled = !email.trim() || !pwd || !pwd2;

  // ——— Render ———
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Prevent inputs being covered by the keyboard, esp. on iOS */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          {/* Heading */}
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>
              Create Account
            </Text>
            <Text style={{ color: colors.subtext, marginTop: 4 }}>
              Sign up to order your coffee
            </Text>
          </View>

          {/* Name (optional) */}
          <Text style={{ color: colors.subtext, marginBottom: 6, fontWeight: '600' }}>
            Name (optional)
          </Text>
          <View style={inputContainer}>
            <Ionicons name="person-outline" size={18} color={colors.subtext} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bhupinder"
              placeholderTextColor={colors.subtext}
              style={inputStyle}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <Text
            style={{
              color: colors.subtext,
              marginTop: 12,
              marginBottom: 6,
              fontWeight: '600',
            }}
          >
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

          {/* Password */}
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
              value={pwd}
              onChangeText={setPwd}
              placeholder="••••••••"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showPwd}
              style={inputStyle}
              returnKeyType="next"
            />
            {/* Show/Hide password toggle with gentle haptic */}
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

          {/* Confirm Password */}
          <Text
            style={{
              color: colors.subtext,
              marginTop: 12,
              marginBottom: 6,
              fontWeight: '600',
            }}
          >
            Confirm password
          </Text>
          <View style={inputContainer}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.subtext} />
            <TextInput
              value={pwd2}
              onChangeText={setPwd2}
              placeholder="••••••••"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showPwd}
              style={inputStyle}
              returnKeyType="go"
              onSubmitEditing={onSignup} // allow keyboard "Go" to submit
            />
          </View>

          {/* Inline help / errors (switches colour when an error is present) */}
          <Text style={{ color: error ? '#FFB4A9' : colors.subtext, marginTop: 8 }}>
            {error || 'Password must be 6+ characters.'}
          </Text>

          {/* Create Account CTA */}
          <Pressable
            onPress={onSignup}
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
            <Text style={{ color: '#1B0F0A', fontWeight: '900' }}>
              Create account
            </Text>
          </Pressable>

          {/* Link to Login (no auto-login after signup) */}
          <Pressable
            onPress={() => navigation.replace('Login')}
            style={{ alignSelf: 'center', marginTop: 16 }}
          >
            <Text style={{ color: colors.subtext }}>
              Already have an account?{' '}
              <Text style={{ color: colors.text, fontWeight: '800' }}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
