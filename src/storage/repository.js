import { addLine, editLine, makeLine } from '../utils/cart';
import { cartPricing } from '../utils/pricing';
import { STORAGE_KEY, decodeState, emptyState, validateState } from './state';
import { importLegacy } from './legacy';

export function createRepository(storage) {
  const access = async (operation, message) => {
    try {
      return await operation();
    } catch (failure) {
      const error = new Error(message);
      error.cause = failure;
      throw error;
    }
  };
  const store = {
    getItem: (key) =>
      access(() => storage.getItem(key), 'Local data could not be read. Please try again.'),
    getAllKeys: () =>
      access(() => storage.getAllKeys(), 'Local data could not be read. Please try again.'),
    setItem: (key, value) =>
      access(
        () => storage.setItem(key, value),
        'Your changes could not be saved. Please try again.',
      ),
  };
  let queue = Promise.resolve();
  const enqueue = (operation) => {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
  };

  const read = async () => {
    const raw = await store.getItem(STORAGE_KEY);
    if (raw !== null) return decodeState(raw);
    const state = await importLegacy(store);
    await store.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  };

  const execute = (command) =>
    enqueue(async () => {
      const state = JSON.parse(JSON.stringify(await read()));
      let value;
      const profile = command.profileId
        ? state.profiles.find((item) => item.id === command.profileId)
        : null;
      if (command.profileId && !profile) throw new Error('Choose a local profile first.');
      const cart = profile ? state.carts[profile.id] : null;
      const updateCart = (lines) => {
        cart.lines = lines;
        cart.revision += 1;
      };

      switch (command.type) {
        case 'createProfile': {
          const name = typeof command.name === 'string' ? command.name.trim() : '';
          if (!name || name.length > 40)
            throw new Error('Enter a profile name between 1 and 40 characters.');
          if (state.profiles.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
            throw new Error(
              'That profile already exists. Select it below or choose a different name.',
            );
          }
          const id = `profile_${state.nextProfileId++}`;
          state.profiles.push({ id, name });
          state.carts[id] = { revision: 0, lines: [] };
          state.activeProfileId = id;
          break;
        }
        case 'selectProfile':
          state.activeProfileId = profile.id;
          break;
        case 'leaveProfile':
          state.activeProfileId = null;
          break;
        case 'dismissNotice':
          state.migrationNotice = '';
          break;
        case 'addItem':
          updateCart(
            addLine(cart.lines, makeLine(command.productId, command.selection, command.quantity)),
          );
          break;
        case 'editItem':
          updateCart(editLine(cart.lines, command.lineId, command.selection, command.quantity));
          break;
        case 'changeQuantity': {
          const line = cart.lines.find((item) => item.id === command.lineId);
          if (!line) throw new Error('This cart item has changed. Please reopen it.');
          const replacement = makeLine(
            line.productId,
            line.selection,
            line.quantity + command.delta,
          );
          updateCart(cart.lines.map((item) => (item.id === line.id ? replacement : item)));
          break;
        }
        case 'removeItem':
          updateCart(cart.lines.filter((line) => line.id !== command.lineId));
          break;
        case 'clearCart':
          updateCart([]);
          break;
        case 'reorder': {
          const order = state.orders.find(
            (item) => item.id === command.orderId && item.profileId === profile.id,
          );
          if (!order) throw new Error('This order could not be found.');
          const lines = order.lines.reduce(
            (next, line) => addLine(next, makeLine(line.productId, line.selection, line.quantity)),
            cart.lines,
          );
          updateCart(lines);
          break;
        }
        case 'checkout': {
          const requestId = `${profile.id}:${command.cartRevision}`;
          const existing = state.orders.find((order) => order.requestId === requestId);
          if (existing) return { state, value: existing };
          if (cart.revision !== command.cartRevision)
            throw new Error('Your cart changed. Review the updated summary and try again.');
          if (!cart.lines.length) throw new Error('Add a coffee before placing an order.');
          const { lines, subtotalCents, gstCents, totalCents } = cartPricing(cart.lines);
          value = {
            id: `order_${state.nextOrderId++}`,
            profileId: profile.id,
            requestId,
            createdAt: new Date().toISOString(),
            lines,
            subtotalCents,
            gstCents,
            totalCents,
          };
          state.orders.unshift(value);
          updateCart([]);
          break;
        }
        default:
          throw new Error('This action is not supported.');
      }
      state.revision += 1;
      validateState(state);
      await store.setItem(STORAGE_KEY, JSON.stringify(state));
      return { state, value };
    });

  const reset = () =>
    enqueue(async () => {
      const raw = await store.getItem(STORAGE_KEY);
      if (raw !== null) await store.setItem(`${STORAGE_KEY}_backup`, raw);
      const state = emptyState();
      await store.setItem(STORAGE_KEY, JSON.stringify(state));
      return { state };
    });

  return { load: () => enqueue(read), execute, reset };
}
