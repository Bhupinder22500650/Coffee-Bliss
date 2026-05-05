/** Global Jest setup for Expo RN */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {},
}));

// Mock @expo/vector-icons to avoid native font loading in tests
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name = 'Icon', ...props }) => React.createElement(Text, props, name);
  return new Proxy({}, { get: () => Icon });
});
