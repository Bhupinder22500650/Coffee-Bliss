import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import menu from '../data/menu.json';
import { DEFAULT_SELECTION } from '../data/options';
import SelectionForm from '../components/SelectionForm';
import QuantitySelector from '../components/QuantitySelector';
import { Button, EmptyState, Screen } from '../components/ui';
import { useApp } from '../context/AppContext';
import { formatMoney, unitPriceCents } from '../utils/pricing';
import { returnToTab } from '../utils/navigation';
import { styles } from '../theme';

function Customize({ product, line, navigation }) {
  const { action, busy } = useApp();
  const [selection, setSelection] = useState(line?.selection || DEFAULT_SELECTION);
  const [quantity, setQuantity] = useState(line?.quantity || 1);
  const submitting = useRef(false);
  const unitCents = unitPriceCents(product.id, selection);
  const save = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      const result = await action(line ? 'editItem' : 'addItem', {
        productId: product.id,
        lineId: line?.id,
        selection,
        quantity,
      });
      if (result.ok) returnToTab(navigation, 'Cart');
    } finally {
      submitting.current = false;
    }
  };
  return (
    <Screen header>
      <Text accessibilityRole="header" style={styles.title}>
        {product.name}
      </Text>
      <Text style={styles.muted}>{product.description}</Text>
      <View style={styles.card}>
        <SelectionForm value={selection} onChange={setSelection} disabled={busy} />
      </View>
      <Text style={styles.label}>Quantity</Text>
      <QuantitySelector value={quantity} onChange={setQuantity} disabled={busy} />
      <Text style={styles.muted}>{formatMoney(unitCents)} each · Excludes GST</Text>
      <Button
        title={`${line ? 'Save changes' : 'Add to cart'} · ${formatMoney(unitCents * quantity)}`}
        onPress={save}
        loading={busy}
      />
    </Screen>
  );
}

export default function DetailsScreen({ route, navigation }) {
  const { cart } = useApp();
  const { productId, lineId } = route.params || {};
  const product = menu.find((item) => item.id === productId);
  const line = lineId ? cart.lines.find((item) => item.id === lineId) : null;
  if (!product || (lineId && !line)) {
    return (
      <Screen header>
        <EmptyState
          title="Item unavailable"
          message="Return to your cart or choose another coffee."
        >
          <Button title="Open cart" onPress={() => returnToTab(navigation, 'Cart')} />
        </EmptyState>
      </Screen>
    );
  }
  return (
    <Customize
      key={`${productId}:${lineId || 'new'}`}
      product={product}
      line={line}
      navigation={navigation}
    />
  );
}
