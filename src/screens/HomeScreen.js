import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import menu from '../data/menu.json';
import CoffeeCard from '../components/CoffeeCard';
import { EmptyState, Notice, Screen } from '../components/ui';
import { useApp } from '../context/AppContext';
import { colors, styles } from '../theme';

const categories = ['All', ...new Set(menu.map((item) => item.category))];

function Filter({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={{
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: selected ? colors.accent : colors.card,
      }}
    >
      <Text style={{ color: selected ? colors.onAccent : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { profile, state, action } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('name');
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return menu
      .filter(
        (item) =>
          (category === 'All' || item.category === category) &&
          `${item.name} ${item.description}`.toLowerCase().includes(search),
      )
      .sort((a, b) =>
        sort === 'price' ? a.priceCents - b.priceCents : a.name.localeCompare(b.name),
      );
  }, [query, category, sort]);

  return (
    <Screen scroll={false}>
      <Text accessibilityRole="header" style={styles.title}>
        Coffee Bliss
      </Text>
      <Text style={styles.muted}>Welcome, {profile.name}. Prices in NZD, excluding GST.</Text>
      {state.migrationNotice ? (
        <Notice onDismiss={() => action('dismissNotice')}>{state.migrationNotice}</Notice>
      ) : null}
      <TextInput
        accessibilityLabel="Search coffee"
        placeholder="Search coffee"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <View style={styles.wrap}>
        {categories.map((label) => (
          <Filter
            key={label}
            label={label}
            selected={label === category}
            onPress={() => setCategory(label)}
          />
        ))}
      </View>
      <View style={styles.row}>
        <Text accessibilityLiveRegion="polite" style={styles.muted}>
          {filtered.length} {filtered.length === 1 ? 'drink' : 'drinks'}
        </Text>
        <View style={styles.wrap}>
          <Filter label="A–Z" selected={sort === 'name'} onPress={() => setSort('name')} />
          <Filter label="Price" selected={sort === 'price'} onPress={() => setSort('price')} />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <CoffeeCard
            item={item}
            onPress={() => navigation.navigate('Details', { productId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState title="No coffee found" message="Try a different name or category." />
        }
      />
    </Screen>
  );
}
