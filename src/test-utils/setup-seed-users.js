// test-utils/setup-seed-users.js
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeAll(async () => {
  const users = [
    { name: 'Bhupinder', email: 'bhupinder@example.com', password: 'pass123' },
    { name: 'Jaskaran', email: 'jas@example.com', password: 'pass123' },
  ];
  await AsyncStorage.setItem('cb_users', JSON.stringify(users));
  await AsyncStorage.removeItem('cb_user'); // start logged out
});

afterEach(async () => {
  // place for per-test cleanup if needed
});
