import React, { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Button, Notice, Screen } from '../components/ui';
import { colors, styles } from '../theme';

export default function ProfilesScreen() {
  const { state, action, busy } = useApp();
  const [name, setName] = useState('');
  return (
    <Screen contentStyle={{ width: '100%', maxWidth: 520, alignSelf: 'center', paddingTop: 40 }}>
      <Image
        source={require('../../assets/logo.png')}
        accessibilityLabel="Coffee Bliss logo"
        style={{ width: 96, height: 96, alignSelf: 'center' }}
      />
      <Text accessibilityRole="header" style={styles.title}>
        Coffee Bliss
      </Text>
      <Text style={styles.muted}>Choose a local profile to browse and save your orders.</Text>
      <Notice>Profiles and orders stay on this device. No password or payment is required.</Notice>
      {state.migrationNotice ? (
        <Notice onDismiss={() => action('dismissNotice')}>{state.migrationNotice}</Notice>
      ) : null}
      <View style={styles.card}>
        <Text style={styles.heading}>Create a profile</Text>
        <Text style={styles.label}>Profile name</Text>
        <TextInput
          accessibilityLabel="Profile name"
          placeholder="e.g. Alex"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={40}
          editable={!busy}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (name.trim() && !busy) action('createProfile', { name });
          }}
        />
        <Button
          title="Create and continue"
          disabled={!name.trim() || busy}
          onPress={() => action('createProfile', { name })}
        />
      </View>
      {state.profiles.length > 0 && (
        <>
          <Text style={styles.heading}>Your profiles</Text>
          {state.profiles.map((profile) => (
            <Button
              key={profile.id}
              title={`Continue as ${profile.name}`}
              secondary
              disabled={busy}
              onPress={() => action('selectProfile', { profileId: profile.id })}
            />
          ))}
        </>
      )}
    </Screen>
  );
}
