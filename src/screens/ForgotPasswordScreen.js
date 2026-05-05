// src/screens/ForgotPasswordScreen.js
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

export default function ForgotPasswordScreen({ navigation }) {
  // scheme (consistent with app)
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

  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

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

  const validate = () => {
    const e = email.trim();
    if (!e || !pwd || !pwd2) {
      setError('Please fill all fields.');
      return false;
    }
    const okEmail = /\S+@\S+\.\S+/.test(e);
    if (!okEmail) {
      setError('Enter a valid email address (e.g., you@example.com).');
      return false;
    }
    if (pwd.length < 6) {
      setError('New password must be at least 6 characters.');
      return false;
    }
    if (pwd !== pwd2) {
      setError('Passwords do not match.');
      return false;
    }
    setError('');
    return true;
  };

  const onReset = async () => {
    if (!validate()) return;
    const res = await resetPassword(email.trim(), pwd);
    if (!res.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Reset failed', res.error || 'Please try again.');
      return;
    }
    Haptics.selectionAsync();
    Alert.alert('Password updated', 'Please login with your new password.');
    navigation.replace('Login');
  };

  const disabled = !email.trim() || !pwd || !pwd2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          {/* Heading */}
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text }}>
              Forgot Password
            </Text>
            <Text style={{ color: colors.subtext, marginTop: 4 }}>
              Enter your email and set a new password
            </Text>
          </View>

          {/* Email */}
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

          {/* New password */}
          <Text
            style={{ color: colors.subtext, marginTop: 12, marginBottom: 6, fontWeight: '600' }}
          >
            New password
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

          {/* Confirm new password */}
          <Text
            style={{ color: colors.subtext, marginTop: 12, marginBottom: 6, fontWeight: '600' }}
          >
            Confirm new password
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
              onSubmitEditing={onReset}
            />
          </View>

          {/* Inline help / errors */}
          <Text style={{ color: error ? '#FFB4A9' : colors.subtext, marginTop: 8 }}>
            {error || 'Password must be 6+ characters.'}
          </Text>

          {/* Update password */}
          <Pressable
            onPress={onReset}
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
            <Text style={{ color: '#1B0F0A', fontWeight: '900' }}>Update password</Text>
          </Pressable>

          {/* Back to Login */}
          <Pressable
            onPress={() => navigation.replace('Login')}
            style={{ alignSelf: 'center', marginTop: 16 }}
          >
            <Text style={{ color: colors.subtext }}>
              Back to <Text style={{ color: colors.text, fontWeight: '800' }}>Login</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
