import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRepository } from '../storage/repository';
import { cartPricing } from '../utils/pricing';

const repository = createRepository(AsyncStorage);
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setState(await repository.load());
    } catch (failure) {
      setError(failure.message || 'Local data could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const perform = useCallback(async (operation) => {
    setPending((count) => count + 1);
    setError('');
    try {
      const result = await operation();
      setState(result.state);
      return { ok: true, value: result.value };
    } catch (failure) {
      setError(failure.message || 'Your changes could not be saved. Please try again.');
      return { ok: false };
    } finally {
      setPending((count) => count - 1);
    }
  }, []);

  const profile = state?.profiles.find((item) => item.id === state.activeProfileId) || null;
  const cart = profile ? state.carts[profile.id] : { revision: 0, lines: [] };
  const pricing = useMemo(() => cartPricing(cart.lines), [cart.lines]);
  const orders = useMemo(
    () => state?.orders.filter((order) => order.profileId === profile?.id) || [],
    [state, profile?.id],
  );
  const action = useCallback(
    (type, payload = {}) =>
      perform(() =>
        repository.execute({
          type,
          profileId: profile?.id,
          ...payload,
        }),
      ),
    [perform, profile?.id],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        profile,
        cart,
        pricing,
        orders,
        loading,
        busy: pending > 0,
        error,
        action,
        reload: load,
        reset: () => perform(repository.reset),
        clearError: () => setError(''),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
}
