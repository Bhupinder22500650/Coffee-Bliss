// Small helper to scope AsyncStorage keys to the current user.
// Falls back to "anon" if user is missing (e.g., before login).
export const keyFor = (base, user) => {
  const raw =
    user?.email ??
    user?.uid ??
    user?.id ??
    'anon';
  const safe = String(raw).toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${base}_${safe}`;
};

