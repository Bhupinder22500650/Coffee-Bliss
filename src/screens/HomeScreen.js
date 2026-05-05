// src/screens/HomeScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CoffeeCard from '../components/CoffeeCard';

export default function HomeScreen({ navigation }) {
// ———  visual theme colors ———
  const colors = {
    background: '#201A18',  // deeper espresso
    header: '#2B2320',      // warm dark
    chip: '#3B302C',        // chip bg
    card: '#4E3E38',        // card bg edge
    border: '#3A2E2A',      // dark chocolate 
    text: '#F6F1EE',        // cream
    subtext: '#DCCFC9',     // latte foam
    accent: '#C67C4E',      // caramel accent
    accentSoft: '#E8C2A5',  // soft accent for counts
  };

  // ——— State ———
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // search & filters
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('popular'); // 'popular' | 'price' | 'name'

  // ——— Load menu (local JSON) ———
  const load = useCallback(async () => {
    try {
      const data = require('../../data/menu.json');
      setMenu(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ——— Debounce search for snappier typing ———
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  // ——— Pull to refresh ———
  const onRefresh = () => {
    setRefreshing(true);
    // tiny buzz to feel the gesture complete
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    load();
  };

  // ——— Derive categories from data ———
  const categories = useMemo(() => {
    const set = new Set();
    menu.forEach((m) => {
      if (m?.category) set.add(String(m.category));
    });
    return ['All', ...Array.from(set)];
  }, [menu]);

  // ——— Filtering & sorting ———
  const filtered = useMemo(() => {
    let list = [...menu];

    // filter by category
    if (category !== 'All') {
      list = list.filter((i) => String(i.category) === category);
    }

    // search filter
    if (debounced) {
      list = list.filter((i) =>
        [i.name, i.description]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(debounced))
      );
    }

    // sort
    if (sort === 'price') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === 'name') {
      list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else {
      // 'popular' fallback — if data has "popular" or "rating" use it; else keep natural
      list.sort((a, b) => (b.popular ?? b.rating ?? 0) - (a.popular ?? a.rating ?? 0));
    }

    return list;
  }, [menu, debounced, category, sort]);

  // ——— Header component ———
  const Header = () => (
    <View style={{ backgroundColor: colors.header, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text }}>Coffee Bliss</Text>
          <Text style={{ color: colors.subtext, marginTop: 2 }}>Brewed fresh for you</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: colors.chip }}>
            <Ionicons name="cafe" size={20} color={colors.accent} />
          </View>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: colors.chip }}>
            <Ionicons name="heart-outline" size={20} color={colors.text} />
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.chip,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="search" size={18} color={colors.subtext} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search coffee, e.g. latte, hazelnut…"
          placeholderTextColor={colors.subtext}
          style={{ color: colors.text, flex: 1, paddingVertical: 2 }}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setQuery('');
            }}
            style={{ padding: 6, borderRadius: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.subtext} />
          </Pressable>
        )}
      </View>

      {/* Category chips */}
      {categories.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {categories.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCategory(c);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: active ? colors.accent : colors.chip,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: active ? '#1B0F0A' : colors.text, fontWeight: '700' }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Sort row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: colors.accentSoft, fontWeight: '700' }}>
          {filtered.length} {filtered.length === 1 ? 'drink' : 'drinks'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { key: 'popular', label: 'Popular' },
            { key: 'price', label: 'Price' },
            { key: 'name', label: 'A–Z' },
          ].map((opt) => {
            const active = sort === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSort(opt.key);
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  backgroundColor: active ? colors.accent : colors.chip,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: active ? '#1B0F0A' : colors.text, fontWeight: '700' }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  // ——— Loading state ———
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="light-content" />
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: colors.subtext }}>Brewing menu…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ——— Empty state helper ———
  const Empty = () => (
    <View style={{ alignItems: 'center', paddingTop: 40 }}>
      <Ionicons name="sad-outline" size={36} color={colors.subtext} />
      <Text style={{ color: colors.subtext, marginTop: 8, textAlign: 'center' }}>
        {debounced || category !== 'All'
          ? 'No matches. Try another search or category.'
          : 'No items available.'}
      </Text>
    </View>
  );

  // ——— Screen ———
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      <Header />

      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
            titleColor={colors.subtext}
          />
        }
        renderItem={({ item }) => (
          <CoffeeCard
            item={item}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate('Details', { item });
            }}
            // If your CoffeeCard uses background or border, this will blend nicely:
            // styleOverride={{ backgroundColor: colors.card, borderColor: colors.border }}
          />
        )}
        ListEmptyComponent={<Empty />}
      />
    </SafeAreaView>
  );
}

