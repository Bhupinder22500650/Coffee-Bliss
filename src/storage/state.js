import { makeLine } from '../utils/cart';
import { normalizeSelection } from '../data/options';

export const STORAGE_KEY = 'cb_state_v2';

export function emptyState() {
  return {
    schemaVersion: 2,
    revision: 0,
    nextProfileId: 1,
    nextOrderId: 1,
    activeProfileId: null,
    profiles: [],
    carts: {},
    orders: [],
    migrationNotice: '',
  };
}

const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function requireValid(condition) {
  if (!condition)
    throw new Error('Saved data is unreadable. Retry loading or reset local data to start again.');
}

export function validateOrder(order) {
  requireValid(record(order) && text(order.id) && text(order.profileId) && text(order.requestId));
  requireValid(typeof order.createdAt === 'string' && Number.isFinite(Date.parse(order.createdAt)));
  requireValid(Array.isArray(order.lines) && order.lines.length > 0);
  for (const line of order.lines) {
    requireValid(record(line) && text(line.productId) && text(line.name));
    requireValid(Number.isSafeInteger(line.quantity) && line.quantity > 0);
    requireValid(integer(line.unitCents) && integer(line.totalCents));
    requireValid(record(line.selection));
    normalizeSelection(line.selection);
  }
  requireValid(
    integer(order.subtotalCents) && integer(order.gstCents) && integer(order.totalCents),
  );
  requireValid(order.subtotalCents === order.lines.reduce((sum, line) => sum + line.totalCents, 0));
  requireValid(order.totalCents === order.subtotalCents + order.gstCents);
  return order;
}

export function validateState(state) {
  requireValid(record(state) && state.schemaVersion === 2 && integer(state.revision));
  requireValid(integer(state.nextProfileId) && state.nextProfileId > 0);
  requireValid(integer(state.nextOrderId) && state.nextOrderId > 0);
  requireValid(Array.isArray(state.profiles) && record(state.carts) && Array.isArray(state.orders));
  requireValid(typeof state.migrationNotice === 'string');
  const profiles = new Set();
  for (const profile of state.profiles) {
    requireValid(record(profile) && /^profile_[1-9]\d*$/.test(profile.id));
    requireValid(Number(profile.id.slice(8)) < state.nextProfileId && !profiles.has(profile.id));
    requireValid(text(profile.name) && profile.name.length <= 40);
    profiles.add(profile.id);
    const cart = state.carts[profile.id];
    requireValid(record(cart) && integer(cart.revision) && Array.isArray(cart.lines));
    const lineIds = new Set();
    for (const line of cart.lines) {
      requireValid(record(line) && record(line.selection));
      const canonical = makeLine(line.productId, line.selection, line.quantity);
      requireValid(line.id === canonical.id && !lineIds.has(line.id));
      lineIds.add(line.id);
    }
  }
  requireValid(Object.keys(state.carts).every((id) => profiles.has(id)));
  requireValid(state.activeProfileId === null || profiles.has(state.activeProfileId));
  const ids = new Set();
  const requests = new Set();
  for (const order of state.orders) {
    validateOrder(order);
    requireValid(profiles.has(order.profileId) && /^order_[1-9]\d*$/.test(order.id));
    requireValid(
      Number(order.id.slice(6)) < state.nextOrderId &&
        !ids.has(order.id) &&
        !requests.has(order.requestId),
    );
    ids.add(order.id);
    requests.add(order.requestId);
  }
  return state;
}

export function decodeState(raw) {
  try {
    return validateState(JSON.parse(raw));
  } catch {
    requireValid(false);
  }
}
