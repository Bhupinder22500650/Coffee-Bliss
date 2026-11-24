import menu from '../data/menu.json';
import { addLine, makeLine } from '../utils/cart';
import { normalizeSelection } from '../data/options';
import { emptyState, validateOrder, validateState } from './state';

// Read the old format without copying passwords or deleting the original keys.
export async function importLegacy(storage) {
  const state = emptyState();
  let skipped = false;
  const read = async (key, fallback) => {
    const raw = await storage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      skipped = true;
      return fallback;
    }
  };
  const rawUsers = await read('cb_users', []);
  const session = await read('cb_user', null);
  const sessionEmail =
    typeof session?.email === 'string' ? session.email.trim().toLowerCase() : null;
  const users = Array.isArray(rawUsers) ? [...rawUsers] : [];
  if (!Array.isArray(rawUsers)) skipped = true;
  if (typeof session?.email === 'string') users.push(session);
  const groups = new Map();
  const seen = new Set();
  for (const user of users) {
    if (typeof user?.email !== 'string' || !user.email.trim()) {
      skipped = true;
      continue;
    }
    const email = user.email.trim().toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const suffix = email.replace(/[^a-z0-9._-]/g, '');
    const group = groups.get(suffix) || [];
    group.push({
      email,
      name: typeof user.name === 'string' ? user.name.trim() : email.split('@')[0],
    });
    groups.set(suffix, group);
  }
  const productId = (line) =>
    menu.find((product) => product.id === line.id || product.name === line.name)?.id;
  const cents = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error('Invalid amount');
    return Math.round(number * 100);
  };
  for (const [suffix, group] of groups) {
    const id = `profile_${state.nextProfileId++}`;
    const baseName =
      group.length > 1
        ? 'Imported shared profile'
        : (group[0].name || 'Imported profile').slice(0, 40);
    let name = baseName;
    let suffixNumber = 2;
    while (state.profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) {
      name = `${baseName.slice(0, 32)} (${suffixNumber++})`;
    }
    if (group.length > 1) skipped = true;
    state.profiles.push({ id, name });
    state.carts[id] = { revision: 0, lines: [] };
    if (group.some((user) => user.email === sessionEmail)) state.activeProfileId = id;
    const cart = await read(`cb_cart_${suffix}`, []);
    if (!Array.isArray(cart)) skipped = true;
    for (const line of Array.isArray(cart) ? cart : []) {
      try {
        const incoming = makeLine(
          productId(line),
          { ...line.options, size: line.size },
          Number(line.qty ?? 1),
        );
        state.carts[id].lines = addLine(state.carts[id].lines, incoming);
      } catch {
        skipped = true;
      }
    }
    const history = await read(`cb_history_${suffix}`, []);
    if (!Array.isArray(history)) skipped = true;
    for (const [index, old] of (Array.isArray(history) ? history : []).entries()) {
      try {
        const lines = old.items.map((line) => {
          const quantity = Number(line.qty ?? 1);
          const unitCents = cents(line.price ?? line.basePrice);
          return {
            productId: productId(line) || String(line.id || 'unavailable'),
            name: line.name,
            quantity,
            selection: normalizeSelection({ ...line.options, size: line.size }),
            unitCents,
            totalCents: line.subtotal == null ? unitCents * quantity : cents(line.subtotal),
          };
        });
        const subtotalCents =
          old.pricing?.subtotal == null
            ? lines.reduce((sum, line) => sum + line.totalCents, 0)
            : cents(old.pricing.subtotal);
        const gstCents =
          old.pricing?.gst == null
            ? Math.round((subtotalCents * 15) / 100)
            : cents(old.pricing.gst);
        const order = validateOrder({
          id: `order_${state.nextOrderId++}`,
          profileId: id,
          requestId: `legacy:${id}:${index}`,
          createdAt: old.createdAt,
          lines,
          subtotalCents,
          gstCents,
          totalCents:
            old.pricing?.total == null ? subtotalCents + gstCents : cents(old.pricing.total),
        });
        state.orders.push(order);
      } catch {
        skipped = true;
      }
    }
  }
  const keys = await storage.getAllKeys();
  if (keys.some((key) => /^cb_(cart|history)_/.test(key)) && groups.size === 0) skipped = true;
  state.migrationNotice = skipped
    ? 'Some previous profiles shared storage or contained unreadable items. Available data was imported; the original data is preserved.'
    : state.profiles.length
      ? 'Your previous local profiles and orders have been imported.'
      : '';
  return validateState(state);
}
